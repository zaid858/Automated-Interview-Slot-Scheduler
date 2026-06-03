-- Automated Interview Slot Scheduler — SQLite Schema

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin','hr','interviewer','candidate')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS candidates (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  applied_role TEXT,
  experience_yrs INTEGER DEFAULT 0,
  priority INTEGER DEFAULT 5,
  rounds INTEGER DEFAULT 1,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','scheduled','completed','cancelled')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS candidate_availability (
  id TEXT PRIMARY KEY,
  candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  slot_id TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS interviewers (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department TEXT,
  expertise TEXT DEFAULT '[]',
  max_per_day INTEGER DEFAULT 5,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS interviewer_availability (
  id TEXT PRIMARY KEY,
  interviewer_id TEXT NOT NULL REFERENCES interviewers(id) ON DELETE CASCADE,
  slot_id TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  capacity INTEGER DEFAULT 2,
  equipment TEXT DEFAULT '[]',
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS time_slots (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  duration INTEGER DEFAULT 60,
  is_break INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS constraints_config (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('hard','soft')),
  category TEXT NOT NULL,
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS schedules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft','confirmed','completed')),
  quality_score REAL DEFAULT 0,
  backtracks INTEGER DEFAULT 0,
  solve_time_ms INTEGER DEFAULT 0,
  created_by TEXT REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS schedule_assignments (
  id TEXT PRIMARY KEY,
  schedule_id TEXT NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  candidate_id TEXT NOT NULL REFERENCES candidates(id),
  interviewer_id TEXT NOT NULL REFERENCES interviewers(id),
  room_id TEXT NOT NULL REFERENCES rooms(id),
  slot_id TEXT NOT NULL REFERENCES time_slots(id),
  round_num INTEGER DEFAULT 1,
  status TEXT DEFAULT 'confirmed' CHECK(status IN ('confirmed','cancelled','rescheduled')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
