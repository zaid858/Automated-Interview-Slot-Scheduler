import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import API from '../../services/api';

export default function MyInterviews() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/schedule/me/assignments').then(r => setInterviews(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <Layout title="My Interviews" subtitle="All your scheduled interview sessions">
      {loading ? (
        <div style={{ display: 'flex', gap: '0.75rem', color: 'var(--text-muted)', alignItems: 'center', padding: '2rem' }}><span className="spinner"/>Loading...</div>
      ) : interviews.length === 0 ? (
        <div className="card"><div className="empty-state"><div className="empty-state-icon">📋</div><h3>No interviews scheduled</h3><p>Set your availability and wait for the admin to generate a schedule</p></div></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {interviews.sort((a,b) => a.date.localeCompare(b.date)).map(a => {
            const isPast = new Date(`${a.date}T${a.start_time}`) < new Date();
            return (
              <div key={a.id} className="card" style={{ borderLeft: `3px solid ${isPast ? 'var(--text-dim)' : 'var(--success)'}`, opacity: isPast ? 0.7 : 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '1rem' }}>Round {a.round_num}</span>
                      <span className={`badge ${isPast ? 'badge-default' : 'badge-success'}`}>{isPast ? 'Completed' : 'Upcoming'}</span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      <div>🎤 Interviewer: <strong>{a.interviewer_name}</strong> · {a.department}</div>
                      <div>🚪 Room: <strong>{a.room_name}</strong></div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-light)' }}>{a.date}</div>
                    <div style={{ fontWeight: 700, color: 'var(--secondary)' }}>{a.start_time} – {a.end_time}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
