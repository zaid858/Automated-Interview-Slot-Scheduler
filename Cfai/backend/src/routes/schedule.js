const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/db');
const auth = require('../middleware/auth');
const fetch = require('node-fetch');

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:5001/api';

// POST /api/schedule/generate
router.post('/generate', auth(['admin', 'hr']), async (req, res) => {
  try {
    const { name } = req.body;

    // 1. Fetch all active candidates with availability
    const candidatesRaw = db.prepare(`
      SELECT c.id, c.priority, c.rounds
      FROM candidates c WHERE c.status = 'pending'
    `).all();

    const candidates = candidatesRaw.map(c => {
      const avail = db.prepare('SELECT slot_id FROM candidate_availability WHERE candidate_id = ?').all(c.id);
      return { ...c, availability: avail.map(a => a.slot_id) };
    });

    // 2. Fetch all interviewers with availability
    const interviewersRaw = db.prepare('SELECT id, max_per_day FROM interviewers').all();
    const interviewers = interviewersRaw.map(iv => {
      const avail = db.prepare('SELECT slot_id FROM interviewer_availability WHERE interviewer_id = ?').all(iv.id);
      return { ...iv, availability: avail.map(a => a.slot_id) };
    });

    // 3. Fetch all slots
    const slots = db.prepare('SELECT * FROM time_slots ORDER BY date, start_time').all();

    // 4. Fetch all active rooms
    const rooms = db.prepare('SELECT id, name FROM rooms WHERE is_active = 1').all();

    if (candidates.length === 0) return res.status(400).json({ error: 'No pending candidates found' });
    if (interviewers.length === 0) return res.status(400).json({ error: 'No interviewers found' });
    if (slots.length === 0) return res.status(400).json({ error: 'No time slots found' });
    if (rooms.length === 0) return res.status(400).json({ error: 'No rooms found' });

    // 5. Call AI engine
    const aiResponse = await fetch(`${AI_ENGINE_URL}/solve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidates, interviewers, slots, rooms, optimize: true }),
      timeout: 60000,
    });

    const aiResult = await aiResponse.json();

    if (!aiResult.success) {
      return res.status(422).json({ error: aiResult.error || 'AI engine failed to find a solution' });
    }

    // 6. Save schedule to DB
    const scheduleId = uuidv4();
    const scheduleName = name || `Schedule ${new Date().toLocaleDateString('en-GB')}`;

    db.prepare(`
      INSERT INTO schedules (id, name, status, quality_score, backtracks, solve_time_ms, created_by)
      VALUES (?, ?, 'confirmed', ?, ?, ?, ?)
    `).run(
      scheduleId, scheduleName,
      aiResult.quality_score || 0,
      aiResult.stats?.backtracks || 0,
      aiResult.stats?.time_ms || 0,
      req.user.id
    );

    const insertAssignment = db.prepare(`
      INSERT INTO schedule_assignments (id, schedule_id, candidate_id, interviewer_id, room_id, slot_id, round_num)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertAll = db.transaction((assignments) => {
      for (const a of assignments) {
        insertAssignment.run(uuidv4(), scheduleId, a.candidate_id, a.interviewer_id, a.room_id, a.slot_id, a.round);
      }
    });
    insertAll(aiResult.schedule);

    // 7. Update candidate statuses
    const scheduledCandidates = [...new Set(aiResult.schedule.map(a => a.candidate_id))];
    const updateStatus = db.transaction((ids) => {
      for (const id of ids) {
        db.prepare("UPDATE candidates SET status = 'scheduled' WHERE id = ?").run(id);
      }
    });
    updateStatus(scheduledCandidates);

    // 8. Create notifications
    const notifInsert = db.prepare('INSERT INTO notifications (id, user_id, title, message) VALUES (?, ?, ?, ?)');
    const notifTx = db.transaction(() => {
      for (const a of aiResult.schedule) {
        // Notify candidate
        const cUser = db.prepare('SELECT user_id FROM candidates WHERE id = ?').get(a.candidate_id);
        const slot = db.prepare('SELECT date, start_time FROM time_slots WHERE id = ?').get(a.slot_id);
        if (cUser && slot) {
          notifInsert.run(uuidv4(), cUser.user_id,
            'Interview Scheduled',
            `Your Round ${a.round} interview is scheduled on ${slot.date} at ${slot.start_time}.`
          );
        }

        // Notify interviewer
        const ivUser = db.prepare('SELECT user_id FROM interviewers WHERE id = ?').get(a.interviewer_id);
        if (ivUser && slot) {
          notifInsert.run(uuidv4(), ivUser.user_id,
            'New Interview Assigned',
            `You have an interview on ${slot.date} at ${slot.start_time}.`
          );
        }
      }
    });
    notifTx();

    res.status(201).json({
      success: true,
      schedule_id: scheduleId,
      name: scheduleName,
      total_interviews: aiResult.schedule.length,
      quality_score: aiResult.quality_score,
      stats: aiResult.stats
    });

  } catch (err) {
    if (err.message.includes('ECONNREFUSED')) {
      return res.status(503).json({ error: 'AI engine is not running. Start it with: python app.py' });
    }
    res.status(500).json({ error: err.message });
  }
});

// GET /api/schedule
router.get('/', auth(), (req, res) => {
  const schedules = db.prepare('SELECT * FROM schedules ORDER BY created_at DESC').all();
  res.json(schedules);
});

// GET /api/schedule/:id
router.get('/:id', auth(), (req, res) => {
  const schedule = db.prepare('SELECT * FROM schedules WHERE id = ?').get(req.params.id);
  if (!schedule) return res.status(404).json({ error: 'Schedule not found' });

  const assignments = db.prepare(`
    SELECT sa.*,
      u_c.name as candidate_name, c.applied_role, c.priority, c.rounds,
      u_iv.name as interviewer_name, iv.department,
      r.name as room_name,
      ts.date, ts.start_time, ts.end_time
    FROM schedule_assignments sa
    JOIN candidates c ON sa.candidate_id = c.id
    JOIN users u_c ON c.user_id = u_c.id
    JOIN interviewers iv ON sa.interviewer_id = iv.id
    JOIN users u_iv ON iv.user_id = u_iv.id
    JOIN rooms r ON sa.room_id = r.id
    JOIN time_slots ts ON sa.slot_id = ts.id
    WHERE sa.schedule_id = ?
    ORDER BY ts.date, ts.start_time
  `).all(req.params.id);

  res.json({ ...schedule, assignments });
});

// GET /api/schedule/me/assignments  (candidate/interviewer sees own interviews)
router.get('/me/assignments', auth(['candidate', 'interviewer']), (req, res) => {
  let profileId;
  if (req.user.role === 'candidate') {
    const c = db.prepare('SELECT id FROM candidates WHERE user_id = ?').get(req.user.id);
    if (!c) return res.json([]);
    profileId = c.id;

    const assignments = db.prepare(`
      SELECT sa.*, s.name as schedule_name,
        u_iv.name as interviewer_name, iv.department,
        r.name as room_name,
        ts.date, ts.start_time, ts.end_time
      FROM schedule_assignments sa
      JOIN schedules s ON sa.schedule_id = s.id
      JOIN interviewers iv ON sa.interviewer_id = iv.id
      JOIN users u_iv ON iv.user_id = u_iv.id
      JOIN rooms r ON sa.room_id = r.id
      JOIN time_slots ts ON sa.slot_id = ts.id
      WHERE sa.candidate_id = ? ORDER BY ts.date, ts.start_time
    `).all(profileId);
    return res.json(assignments);
  }

  if (req.user.role === 'interviewer') {
    const iv = db.prepare('SELECT id FROM interviewers WHERE user_id = ?').get(req.user.id);
    if (!iv) return res.json([]);
    profileId = iv.id;

    const assignments = db.prepare(`
      SELECT sa.*, s.name as schedule_name,
        u_c.name as candidate_name, c.applied_role,
        r.name as room_name,
        ts.date, ts.start_time, ts.end_time
      FROM schedule_assignments sa
      JOIN schedules s ON sa.schedule_id = s.id
      JOIN candidates c ON sa.candidate_id = c.id
      JOIN users u_c ON c.user_id = u_c.id
      JOIN rooms r ON sa.room_id = r.id
      JOIN time_slots ts ON sa.slot_id = ts.id
      WHERE sa.interviewer_id = ? ORDER BY ts.date, ts.start_time
    `).all(profileId);
    return res.json(assignments);
  }
});

// DELETE /api/schedule/:id
router.delete('/:id', auth(['admin']), (req, res) => {
  db.prepare('DELETE FROM schedules WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
