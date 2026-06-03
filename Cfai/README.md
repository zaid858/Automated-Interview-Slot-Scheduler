# 🤖 Automated Interview Slot Scheduler

An AI-powered interview scheduling system using **Constraint Satisfaction Problems (CSP)** with Backtracking, MRV, LCV, Forward Checking, and AC-3.

## Architecture

```
frontend/     ← React + Vite (port 5173)
backend/      ← Node.js + Express + SQLite (port 3001)
ai-engine/    ← Python Flask + CSP Solver (port 5001)
```

## Quick Start

### Step 1: Install Python Flask (AI Engine)
```bash
# On Ubuntu/Debian:
sudo apt install python3-pip
pip3 install flask flask-cors python-dotenv --user

# OR via conda:
conda install flask flask-cors
```

### Step 2: Seed the database
```bash
cd backend
npm install
node src/utils/seed.js
```

### Step 3: Start all 3 services (3 separate terminals)

**Terminal 1 — AI Engine:**
```bash
cd ai-engine
python3 app.py
```

**Terminal 2 — Backend:**
```bash
cd backend
npm run dev
```

**Terminal 3 — Frontend:**
```bash
cd frontend
npm run dev
```

Open: **http://localhost:5173**

## Demo Login Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@scheduler.com | admin123 |
| HR | hr@scheduler.com | hr1234 |
| Interviewer | priya@scheduler.com | pass123 |
| Candidate | alice@candidate.com | pass123 |

## How to Use (Admin Flow)

1. **Login** as Admin
2. Check **Candidates** and **Interviewers** (pre-seeded)
3. Go to **Time Slots** → Generate slots for date range
4. Go to **Generate Schedule** → Click "Generate Schedule"
5. The AI engine runs CSP → Go to **View Schedule** to see results
6. Candidates/Interviewers can login to see their assignments

## AI Algorithm

```
Input → AC-3 (domain reduction)
      → Backtracking Search
        → MRV (pick variable with fewest options)
        → LCV (pick value that blocks others least)
        → Forward Checking (prune on assignment)
      → Hill Climbing (optimize soft constraints)
      → Final Schedule
```

## Project Structure

```
Cfai/
├── ai-engine/
│   ├── app.py              ← Flask entry point
│   ├── csp/
│   │   ├── solver.py       ← Backtracking + MRV + LCV + FC
│   │   ├── constraints.py  ← Hard & soft constraint functions
│   │   ├── heuristics.py   ← MRV, LCV, AC-3
│   │   └── optimizer.py    ← Hill climbing
│   └── api/routes.py       ← /solve, /validate endpoints
├── backend/
│   ├── src/
│   │   ├── app.js          ← Express entry point
│   │   ├── db/             ← SQLite schema + connection
│   │   ├── routes/         ← All API routes
│   │   ├── middleware/     ← JWT auth
│   │   └── utils/seed.js   ← Demo data seeder
│   └── data/scheduler.db   ← SQLite database (auto-created)
└── frontend/
    └── src/
        ├── pages/
        │   ├── auth/       ← Login, Register
        │   ├── admin/      ← Dashboard, Candidates, Interviewers, Rooms, Slots, Constraints, Schedule
        │   ├── interviewer/← Dashboard, Schedule, Availability
        │   └── candidate/  ← Dashboard, Interviews, Availability
        ├── components/     ← Shared components
        ├── context/        ← Auth context
        └── services/       ← Axios API client
```
