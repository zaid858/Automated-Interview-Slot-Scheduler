import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import API from '../../services/api';

export default function MySchedule() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/schedule/me/assignments').then(r => setAssignments(r.data)).finally(() => setLoading(false));
  }, []);

  const grouped = assignments.reduce((acc, a) => {
    (acc[a.date] = acc[a.date] || []).push(a);
    return acc;
  }, {});

  return (
    <Layout title="My Schedule" subtitle="All your assigned interview sessions">
      {loading ? (
        <div style={{ display: 'flex', gap: '0.75rem', color: 'var(--text-muted)', alignItems: 'center', padding: '2rem' }}><span className="spinner"/>Loading...</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="card"><div className="empty-state"><div className="empty-state-icon">📅</div><h3>No interviews assigned</h3><p>The admin will assign you interviews after generating a schedule</p></div></div>
      ) : (
        Object.entries(grouped).sort().map(([date, list]) => (
          <div className="card" key={date} style={{ marginBottom: '1.25rem' }}>
            <div className="card-header">
              <div><div className="card-title">📅 {date}</div><div className="card-subtitle">{list.length} interview(s)</div></div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {list.sort((a,b) => a.start_time.localeCompare(b.start_time)).map(a => (
                <div key={a.id} className="schedule-slot confirmed">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{a.candidate_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.applied_role} · Round {a.round_num}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: 'var(--primary-light)' }}>{a.start_time} – {a.end_time}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>🚪 {a.room_name}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </Layout>
  );
}
