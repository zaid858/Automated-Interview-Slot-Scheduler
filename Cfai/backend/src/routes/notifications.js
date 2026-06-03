const express = require('express');
const router = express.Router();
const db = require('../db/db');
const auth = require('../middleware/auth');

// GET /api/notifications
router.get('/', auth(), (req, res) => {
  const notifications = db.prepare(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50'
  ).all(req.user.id);
  res.json(notifications);
});

// GET /api/notifications/unread-count
router.get('/unread-count', auth(), (req, res) => {
  const row = db.prepare(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0'
  ).get(req.user.id);
  res.json({ count: row.count });
});

// PUT /api/notifications/:id/read
router.put('/:id/read', auth(), (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?')
    .run(req.params.id, req.user.id);
  res.json({ success: true });
});

// PUT /api/notifications/read-all
router.put('/read-all/mark', auth(), (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
  res.json({ success: true });
});

module.exports = router;
