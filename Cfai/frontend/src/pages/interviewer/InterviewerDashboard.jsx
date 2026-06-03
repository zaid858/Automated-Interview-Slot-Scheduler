import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import API from '../../services/api';

export default function InterviewerDashboard() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/schedule/me/assignments').then(r => setAssignments(r.data)).finally(() => setLoading(false));
  }, []);

  const upcoming = assignments.filter(a => new Date(`${a.date}T${a.start_time}`) >= new Date());
  const past = assignments.filter(a => new Date(`${a.date}T${a.start_time}`) < new Date());

  return (
    <Layout title="Interviewer Dashboard" subtitle="Your upcoming interview assignments">
      <div className="stats-grid">
        {[
          { label: 'Total Assigned', value: assignments.length, icon: '📋', color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
          { label: 'Upcoming', value: upcoming.length, icon: '⏰', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
          { label: 'Completed', value: past.length, icon: '✅', color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-icon" style={{ background: s.bg, color: s.color, fontSize: '1.5rem' }}>{s.icon}</div>
            <div className="stat-info">
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div className="card-header"><div className="card-title">📅 Upcoming Interviews</div></div>
        {loading ? (
          <div style={{ display: 'flex', gap: '0.75rem', color: 'var(--text-muted)', alignItems: 'center', padding: '1rem' }}><span className="spinner"/>Loading...</div>
        ) : upcoming.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">🎤</div><h3>No upcoming interviews</h3><p>Check back after the admin generates a schedule</p></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {upcoming.slice(0, 10).map(a => (
              <div key={a.id} className="schedule-slot confirmed">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{a.candidate_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.applied_role} · Round {a.round_num}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: 'var(--primary-light)' }}>{a.date} · {a.start_time}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{a.room_name}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
