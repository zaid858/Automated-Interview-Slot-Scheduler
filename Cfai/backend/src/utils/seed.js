/**
 * Seed script: Creates demo users, candidates, interviewers, rooms, slots, and constraints.
 * Run: node src/utils/seed.js
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/db');

async function seed() {
  console.log('🌱 Seeding database...');

  // ── USERS ───────────────────────────────────────────────────────────────────
  const users = [
    { name: 'Admin User', email: 'admin@scheduler.com', password: 'admin123', role: 'admin' },
    { name: 'HR Manager', email: 'hr@scheduler.com', password: 'hr1234', role: 'hr' },
    { name: 'Dr. Priya Sharma', email: 'priya@scheduler.com', password: 'pass123', role: 'interviewer' },
    { name: 'Mr. Raj Kumar', email: 'raj@scheduler.com', password: 'pass123', role: 'interviewer' },
    { name: 'Ms. Aisha Patel', email: 'aisha@scheduler.com', password: 'pass123', role: 'interviewer' },
    { name: 'Alice Johnson', email: 'alice@candidate.com', password: 'pass123', role: 'candidate' },
    { name: 'Bob Williams', email: 'bob@candidate.com', password: 'pass123', role: 'candidate' },
    { name: 'Carol Davis', email: 'carol@candidate.com', password: 'pass123', role: 'candidate' },
    { name: 'David Lee', email: 'david@candidate.com', password: 'pass123', role: 'candidate' },
  ];

  const insertUser = db.prepare('INSERT OR IGNORE INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)');
  const insertCandidate = db.prepare('INSERT OR IGNORE INTO candidates (id, user_id, applied_role, experience_yrs, priority, rounds) VALUES (?, ?, ?, ?, ?, ?)');
  const insertInterviewer = db.prepare('INSERT OR IGNORE INTO interviewers (id, user_id, department, expertise, max_per_day) VALUES (?, ?, ?, ?, ?)');

  const userIds = {};
  const candidateIds = {};
  const interviewerIds = {};

  for (const u of users) {
    const hashed = bcrypt.hashSync(u.password, 10);
    const uid = uuidv4();
    userIds[u.email] = uid;
    insertUser.run(uid, u.name, u.email, hashed, u.role);
  }

  // Candidates
  const candidateData = [
    { email: 'alice@candidate.com', role: 'Software Engineer', exp: 3, priority: 1, rounds: 2 },
    { email: 'bob@candidate.com', role: 'Data Analyst', exp: 1, priority: 2, rounds: 1 },
    { email: 'carol@candidate.com', role: 'Project Manager', exp: 5, priority: 3, rounds: 2 },
    { email: 'david@candidate.com', role: 'UI/UX Designer', exp: 2, priority: 4, rounds: 1 },
  ];
  for (const cd of candidateData) {
    const cid = uuidv4();
    candidateIds[cd.email] = cid;
    insertCandidate.run(cid, userIds[cd.email], cd.role, cd.exp, cd.priority, cd.rounds);
  }

  // Interviewers
  const interviewerData = [
    { email: 'priya@scheduler.com', dept: 'Engineering', expertise: ['Python','AI','ML'], max: 4 },
    { email: 'raj@scheduler.com', dept: 'Data Science', expertise: ['SQL','Analytics'], max: 5 },
    { email: 'aisha@scheduler.com', dept: 'Design', expertise: ['Figma','UX Research'], max: 3 },
  ];
  for (const iv of interviewerData) {
    const ivid = uuidv4();
    interviewerIds[iv.email] = ivid;
    insertInterviewer.run(ivid, userIds[iv.email], iv.dept, JSON.stringify(iv.expertise), iv.max);
  }

  // ── ROOMS ────────────────────────────────────────────────────────────────────
  const rooms = [
    { name: 'Room A', capacity: 3, equipment: ['Whiteboard', 'Projector'] },
    { name: 'Room B', capacity: 2, equipment: ['Whiteboard'] },
    { name: 'Room C', capacity: 4, equipment: ['TV Screen', 'Webcam'] },
  ];
  const insertRoom = db.prepare('INSERT OR IGNORE INTO rooms (id, name, capacity, equipment) VALUES (?, ?, ?, ?)');
  const roomIds = {};
  for (const r of rooms) {
    const rid = uuidv4();
    roomIds[r.name] = rid;
    insertRoom.run(rid, r.name, r.capacity, JSON.stringify(r.equipment));
  }

  // ── TIME SLOTS ───────────────────────────────────────────────────────────────
  const dates = ['2025-07-01', '2025-07-02', '2025-07-03'];
  const times = [
    { start: '09:00', end: '10:00', isBreak: false },
    { start: '10:00', end: '11:00', isBreak: false },
    { start: '11:00', end: '12:00', isBreak: false },
    { start: '12:00', end: '13:00', isBreak: true },  // Lunch
    { start: '13:00', end: '14:00', isBreak: false },
    { start: '14:00', end: '15:00', isBreak: false },
    { start: '15:00', end: '16:00', isBreak: false },
    { start: '16:00', end: '17:00', isBreak: false },
  ];

  const insertSlot = db.prepare('INSERT OR IGNORE INTO time_slots (id, date, start_time, end_time, duration, is_break) VALUES (?, ?, ?, ?, 60, ?)');
  const slotIds = {}; // date_startTime → id

  for (const date of dates) {
    for (const t of times) {
      const sid = uuidv4();
      const key = `${date}_${t.start}`;
      slotIds[key] = sid;
      insertSlot.run(sid, date, t.start, t.end, t.isBreak ? 1 : 0);
    }
  }

  // ── AVAILABILITY ─────────────────────────────────────────────────────────────
  // All candidates available all non-break slots on all 3 days
  const availSlots = Object.entries(slotIds).filter(([k]) => !k.includes('12:00')).map(([, v]) => v);

  const insertCandidateAvail = db.prepare('INSERT OR IGNORE INTO candidate_availability (id, candidate_id, slot_id) VALUES (?, ?, ?)');
  const insertIvAvail = db.prepare('INSERT OR IGNORE INTO interviewer_availability (id, interviewer_id, slot_id) VALUES (?, ?, ?)');

  for (const cid of Object.values(candidateIds)) {
    for (const sid of availSlots) insertCandidateAvail.run(uuidv4(), cid, sid);
  }

  // Interviewers have partial availability
  const ivAvailMap = {
    'priya@scheduler.com': availSlots.slice(0, 14),
    'raj@scheduler.com': availSlots.slice(7, 21),
    'aisha@scheduler.com': availSlots,
  };
  for (const [email, slots] of Object.entries(ivAvailMap)) {
    const ivid = interviewerIds[email];
    for (const sid of slots) insertIvAvail.run(uuidv4(), ivid, sid);
  }

  // ── DEFAULT CONSTRAINTS ──────────────────────────────────────────────────────
  const insertConstraint = db.prepare('INSERT OR IGNORE INTO constraints_config (id, type, category, label, value) VALUES (?, ?, ?, ?, ?)');
  const defaultConstraints = [
    { type: 'hard', cat: 'no_overlap', label: 'No interviewer double booking', value: 'true' },
    { type: 'hard', cat: 'no_room_conflict', label: 'No room double booking', value: 'true' },
    { type: 'hard', cat: 'candidate_availability', label: 'Respect candidate availability', value: 'true' },
    { type: 'hard', cat: 'interviewer_availability', label: 'Respect interviewer availability', value: 'true' },
    { type: 'soft', cat: 'min_gap', label: 'Min gap between rounds (slots)', value: '1' },
    { type: 'soft', cat: 'max_per_day', label: 'Max interviews per interviewer per day', value: '5' },
    { type: 'soft', cat: 'priority_morning', label: 'High priority candidates get morning slots', value: 'true' },
  ];
  for (const c of defaultConstraints) {
    insertConstraint.run(uuidv4(), c.type, c.cat, c.label, c.value);
  }

  console.log('✅ Seed complete!');
  console.log('\n📋 Demo Login Credentials:');
  console.log('  Admin:       admin@scheduler.com / admin123');
  console.log('  HR:          hr@scheduler.com / hr1234');
  console.log('  Interviewer: priya@scheduler.com / pass123');
  console.log('  Candidate:   alice@candidate.com / pass123');
}

seed().catch(console.error);
