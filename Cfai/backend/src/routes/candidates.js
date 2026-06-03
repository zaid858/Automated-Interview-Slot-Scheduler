const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/db');
const auth = require('../middleware/auth');

// GET /api/candidates
router.get('/', auth(['admin', 'hr']), (req, res) => {
  const candidates = db.prepare(`
    SELECT c.*, u.name, u.email, u.role
    FROM candidates c JOIN users u ON c.user_id = u.id
    ORDER BY c.priority ASC, c.created_at DESC
  `).all();

  // Add availability slot IDs
  const result = candidates.map(c => {
    const avail = db.prepare('SELECT slot_id FROM candidate_availability WHERE candidate_id = ?').all(c.id);
    return { ...c, availability: avail.map(a => a.slot_id) };
  });

  res.json(result);
});

// GET /api/candidates/:id
router.get('/:id', auth(), (req, res) => {
  const c = db.prepare(`
    SELECT c.*, u.name, u.email FROM candidates c JOIN users u ON c.user_id = u.id WHERE c.id = ?
  `).get(req.params.id);
  if (!c) return res.status(404).json({ error: 'Candidate not found' });

  const avail = db.prepare('SELECT slot_id FROM candidate_availability WHERE candidate_id = ?').all(c.id);
  res.json({ ...c, availability: avail.map(a => a.slot_id) });
});

// GET /api/candidates/me/profile  (candidate sees own profile)
router.get('/me/profile', auth(['candidate']), (req, res) => {
  const c = db.prepare(`
    SELECT c.*, u.name, u.email FROM candidates c JOIN users u ON c.user_id = u.id WHERE u.id = ?
  `).get(req.user.id);
  if (!c) return res.status(404).json({ error: 'Profile not found' });

  const avail = db.prepare('SELECT slot_id FROM candidate_availability WHERE candidate_id = ?').all(c.id);
  res.json({ ...c, availability: avail.map(a => a.slot_id) });
});

// PUT /api/candidates/:id
router.put('/:id', auth(['admin', 'hr']), (req, res) => {
  const { applied_role, experience_yrs, priority, rounds, status } = req.body;
  db.prepare(`
    UPDATE candidates SET applied_role=?, experience_yrs=?, priority=?, rounds=?, status=? WHERE id=?
  `).run(applied_role, experience_yrs, priority, rounds, status, req.params.id);
  res.json({ success: true });
});

// PUT /api/candidates/:id/availability
router.put('/:id/availability', auth(), (req, res) => {
  const { slot_ids } = req.body; // array of slot IDs
  if (!Array.isArray(slot_ids)) return res.status(400).json({ error: 'slot_ids must be array' });

  const candidateId = req.params.id;
  db.prepare('DELETE FROM candidate_availability WHERE candidate_id = ?').run(candidateId);

  const insert = db.prepare('INSERT INTO candidate_availability (id, candidate_id, slot_id) VALUES (?, ?, ?)');
  const insertMany = db.transaction((ids) => {
    for (const slotId of ids) insert.run(uuidv4(), candidateId, slotId);
  });
  insertMany(slot_ids);

  res.json({ success: true, count: slot_ids.length });
});

// DELETE /api/candidates/:id
router.delete('/:id', auth(['admin']), (req, res) => {
  db.prepare('DELETE FROM candidates WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
