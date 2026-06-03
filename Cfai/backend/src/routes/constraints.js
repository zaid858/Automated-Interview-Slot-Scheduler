const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/db');
const auth = require('../middleware/auth');

// GET /api/constraints
router.get('/', auth(), (req, res) => {
  const constraints = db.prepare('SELECT * FROM constraints_config ORDER BY type, category').all();
  res.json(constraints);
});

// POST /api/constraints
router.post('/', auth(['admin']), (req, res) => {
  const { type, category, label, value } = req.body;
  if (!type || !category || !label || value === undefined) {
    return res.status(400).json({ error: 'type, category, label, value required' });
  }
  const id = uuidv4();
  db.prepare('INSERT INTO constraints_config (id, type, category, label, value) VALUES (?, ?, ?, ?, ?)')
    .run(id, type, category, label, String(value));
  res.status(201).json({ id, type, category, label, value });
});

// PUT /api/constraints/:id
router.put('/:id', auth(['admin']), (req, res) => {
  const { label, value, is_active } = req.body;
  db.prepare('UPDATE constraints_config SET label=?, value=?, is_active=? WHERE id=?')
    .run(label, String(value), is_active ?? 1, req.params.id);
  res.json({ success: true });
});

// DELETE /api/constraints/:id
router.delete('/:id', auth(['admin']), (req, res) => {
  db.prepare('DELETE FROM constraints_config WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
