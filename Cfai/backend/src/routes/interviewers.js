const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/db');
const auth = require('../middleware/auth');

// GET /api/interviewers
router.get('/', auth(), (req, res) => {
  const ivs = db.prepare(`
    SELECT iv.*, u.name, u.email FROM interviewers iv JOIN users u ON iv.user_id = u.id
    ORDER BY iv.created_at DESC
  `).all();

  const result = ivs.map(iv => {
    const avail = db.prepare('SELECT slot_id FROM interviewer_availability WHERE interviewer_id = ?').all(iv.id);
    return { ...iv, availability: avail.map(a => a.slot_id), expertise: JSON.parse(iv.expertise || '[]') };
  });

  res.json(result);
});

// GET /api/interviewers/me/profile
router.get('/me/profile', auth(['interviewer']), (req, res) => {
  const iv = db.prepare(`
    SELECT iv.*, u.name, u.email FROM interviewers iv JOIN users u ON iv.user_id = u.id WHERE u.id = ?
  `).get(req.user.id);
  if (!iv) return res.status(404).json({ error: 'Profile not found' });

  const avail = db.prepare('SELECT slot_id FROM interviewer_availability WHERE interviewer_id = ?').all(iv.id);
  res.json({ ...iv, availability: avail.map(a => a.slot_id), expertise: JSON.parse(iv.expertise || '[]') });
});

// GET /api/interviewers/:id
router.get('/:id', auth(), (req, res) => {
  const iv = db.prepare(`
    SELECT iv.*, u.name, u.email FROM interviewers iv JOIN users u ON iv.user_id = u.id WHERE iv.id = ?
  `).get(req.params.id);
  if (!iv) return res.status(404).json({ error: 'Not found' });

  const avail = db.prepare('SELECT slot_id FROM interviewer_availability WHERE interviewer_id = ?').all(iv.id);
  res.json({ ...iv, availability: avail.map(a => a.slot_id), expertise: JSON.parse(iv.expertise || '[]') });
});

// PUT /api/interviewers/:id
router.put('/:id', auth(['admin', 'hr', 'interviewer']), (req, res) => {
  const { department, expertise, max_per_day } = req.body;
  db.prepare(`UPDATE interviewers SET department=?, expertise=?, max_per_day=? WHERE id=?`)
    .run(department, JSON.stringify(expertise || []), max_per_day || 5, req.params.id);
  res.json({ success: true });
});

// PUT /api/interviewers/:id/availability
router.put('/:id/availability', auth(), (req, res) => {
  const { slot_ids } = req.body;
  if (!Array.isArray(slot_ids)) return res.status(400).json({ error: 'slot_ids must be array' });

  const ivId = req.params.id;
  db.prepare('DELETE FROM interviewer_availability WHERE interviewer_id = ?').run(ivId);

  const insert = db.prepare('INSERT INTO interviewer_availability (id, interviewer_id, slot_id) VALUES (?, ?, ?)');
  const insertMany = db.transaction((ids) => {
    for (const slotId of ids) insert.run(uuidv4(), ivId, slotId);
  });
  insertMany(slot_ids);

  res.json({ success: true, count: slot_ids.length });
});

module.exports = router;
