require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'] }));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/candidates', require('./routes/candidates'));
app.use('/api/interviewers', require('./routes/interviewers'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/slots', require('./routes/slots'));
app.use('/api/constraints', require('./routes/constraints'));
app.use('/api/schedule', require('./routes/schedule'));
app.use('/api/notifications', require('./routes/notifications'));

// Stats endpoint for admin dashboard
app.get('/api/stats', require('./middleware/auth')(['admin', 'hr']), (req, res) => {
  const db = require('./db/db');
  const totalCandidates = db.prepare('SELECT COUNT(*) as c FROM candidates').get().c;
  const scheduled = db.prepare("SELECT COUNT(*) as c FROM candidates WHERE status='scheduled'").get().c;
  const totalInterviewers = db.prepare('SELECT COUNT(*) as c FROM interviewers').get().c;
  const totalRooms = db.prepare('SELECT COUNT(*) as c FROM rooms WHERE is_active=1').get().c;
  const totalSlots = db.prepare('SELECT COUNT(*) as c FROM time_slots WHERE is_break=0').get().c;
  const totalSchedules = db.prepare('SELECT COUNT(*) as c FROM schedules').get().c;
  const recentSchedules = db.prepare('SELECT * FROM schedules ORDER BY created_at DESC LIMIT 5').all();

  res.json({
    totalCandidates, scheduled, pending: totalCandidates - scheduled,
    totalInterviewers, totalRooms, totalSlots, totalSchedules,
    recentSchedules
  });
});

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'Interview Scheduler API' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
