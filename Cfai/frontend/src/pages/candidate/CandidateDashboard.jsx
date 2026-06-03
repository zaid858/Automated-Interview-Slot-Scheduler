import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import API from '../../services/api';

export default function CandidateDashboard() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/schedule/me/assignments').then(r => setInterviews(r.data)).finally(() => setLoading(false));
  }, []);

  const upcoming = interviews.filter(a => new Date(`${a.date}T${a.start_time}`) >= new Date());

  return (
    <Layout title="My Dashboard" subtitle="Your interview schedule and status">
      <div className="stats-grid">
        {[
          { label: 'Total Interviews', value: interviews.length, icon: '📋', color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
          { label: 'Upcoming', value: upcoming.length, icon: '⏰', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
          { label: 'Completed', value: interviews.length - upcoming.length, icon: '✅', color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' },
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
          <div className="empty-state">
            <div className="empty-state-icon">👤</div>
            <h3>No interviews scheduled yet</h3>
            <p>Please set your availability so the admin can schedule your interviews</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {upcoming.map(a => (
              <div key={a.id} className="schedule-slot confirmed">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>Round {a.round_num} Interview</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      🎤 {a.interviewer_name} · {a.department}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: 'var(--primary-light)' }}>{a.date}</div>
                    <div style={{ fontWeight: 700, color: 'var(--secondary)' }}>{a.start_time} – {a.end_time}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>🚪 {a.room_name}</div>
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
