const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/db');
const auth = require('../middleware/auth');

// GET /api/slots
router.get('/', auth(), (req, res) => {
  const slots = db.prepare('SELECT * FROM time_slots ORDER BY date ASC, start_time ASC').all();
  res.json(slots);
});

// POST /api/slots/generate — bulk generate slots for a date range
router.post('/generate', auth(['admin']), (req, res) => {
  const { start_date, end_date, start_hour, end_hour, duration, break_times, exclude_weekends } = req.body;

  if (!start_date || !end_date) return res.status(400).json({ error: 'start_date and end_date required' });

  const slotDuration = duration || 60; // minutes
  const startH = start_hour || 9;
  const endH = end_hour || 17;
  const breaks = break_times || ['12:00', '13:00']; // lunch

  const generated = [];
  const current = new Date(start_date);
  const end = new Date(end_date);

  while (current <= end) {
    const dayOfWeek = current.getDay();
    if (exclude_weekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
      current.setDate(current.getDate() + 1);
      continue;
    }

    const dateStr = current.toISOString().split('T')[0];
    let hour = startH;
    let minute = 0;

    while (hour < endH) {
      const startTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      const totalMinutes = hour * 60 + minute + slotDuration;
      const endHour = Math.floor(totalMinutes / 60);
      const endMin = totalMinutes % 60;
      const endTime = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;

      if (endHour > endH) break;

      const isBreak = breaks.includes(startTime);
      const id = uuidv4();

      // Check if slot already exists for this date/time
      const existing = db.prepare('SELECT id FROM time_slots WHERE date = ? AND start_time = ?').get(dateStr, startTime);
      if (!existing) {
        db.prepare(
          'INSERT INTO time_slots (id, date, start_time, end_time, duration, is_break) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(id, dateStr, startTime, endTime, slotDuration, isBreak ? 1 : 0);
        generated.push({ id, date: dateStr, start_time: startTime, end_time: endTime, is_break: isBreak });
      }

      minute += slotDuration;
      if (minute >= 60) { hour += Math.floor(minute / 60); minute = minute % 60; }
    }

    current.setDate(current.getDate() + 1);
  }

  res.status(201).json({ generated: generated.length, slots: generated });
});

// POST /api/slots — single slot
router.post('/', auth(['admin']), (req, res) => {
  const { date, start_time, end_time, duration, is_break } = req.body;
  if (!date || !start_time || !end_time) return res.status(400).json({ error: 'date, start_time, end_time required' });
  const id = uuidv4();
  db.prepare('INSERT INTO time_slots (id, date, start_time, end_time, duration, is_break) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, date, start_time, end_time, duration || 60, is_break ? 1 : 0);
  res.status(201).json({ id, date, start_time, end_time });
});

// DELETE /api/slots/:id
router.delete('/:id', auth(['admin']), (req, res) => {
  db.prepare('DELETE FROM time_slots WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// DELETE /api/slots/all — clear all slots
router.delete('/all/clear', auth(['admin']), (req, res) => {
  db.prepare('DELETE FROM time_slots').run();
  res.json({ success: true });
});

module.exports = router;
