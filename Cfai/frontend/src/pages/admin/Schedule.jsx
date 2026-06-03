import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import API from '../../services/api';
import { RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

export default function Schedule() {
  const [schedules, setSchedules] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    setLoading(true);
    API.get('/schedule').then(r => {
      setSchedules(r.data);
      if (r.data.length > 0) loadDetail(r.data[0].id);
    }).finally(() => setLoading(false));
  }, []);

  const loadDetail = (id) => {
    setDetailLoading(true);
    API.get(`/schedule/${id}`).then(r => setSelected(r.data)).finally(() => setDetailLoading(false));
  };

  // Group assignments by date
  const groupedByDate = selected?.assignments?.reduce((acc, a) => {
    (acc[a.date] = acc[a.date] || []).push(a);
    return acc;
  }, {}) || {};

  return (
    <Layout title="View Schedule" subtitle="Generated interview timetables">
      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Schedule List */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">All Schedules</div>
            <button className="btn btn-secondary btn-sm" onClick={() => API.get('/schedule').then(r => setSchedules(r.data))}>
              <RefreshCw size={13}/>
            </button>
          </div>
          {loading ? (
            <div style={{ display: 'flex', gap: '0.75rem', color: 'var(--text-muted)', alignItems: 'center', padding: '1rem' }}><span className="spinner"/>Loading...</div>
          ) : schedules.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">📅</div><h3>No schedules yet</h3><p>Generate a schedule first</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {schedules.map(s => (
                <div key={s.id}
                  onClick={() => loadDetail(s.id)}
                  style={{
                    padding: '0.9rem 1rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                    border: `1px solid ${selected?.id === s.id ? 'var(--primary)' : 'var(--border-soft)'}`,
                    background: selected?.id === s.id ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.02)',
                    transition: 'var(--transition)',
                  }}>
                  <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{s.name}</div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className={`badge badge-${s.status === 'confirmed' ? 'success' : 'warning'}`}>{s.status}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Score: {s.quality_score?.toFixed(1)}%</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{new Date(s.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Schedule Detail */}
        <div>
          {detailLoading ? (
            <div className="card" style={{ display: 'flex', gap: '0.75rem', color: 'var(--text-muted)', alignItems: 'center', padding: '2rem', justifyContent: 'center' }}>
              <span className="spinner"/>Loading schedule...
            </div>
          ) : selected ? (
            <>
              <div className="card" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{selected.name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                      {selected.assignments?.length} interviews · Quality: {selected.quality_score?.toFixed(1)}% · {selected.backtracks} backtracks · {selected.solve_time_ms}ms
                    </div>
                  </div>
                  <span className={`badge badge-${selected.status === 'confirmed' ? 'success' : 'warning'}`}>{selected.status}</span>
                </div>
              </div>

              {Object.entries(groupedByDate).sort().map(([date, assignments]) => (
                <div className="card" key={date} style={{ marginBottom: '1rem' }}>
                  <div className="card-header" style={{ cursor: 'pointer', marginBottom: expanded === date ? '1rem' : 0 }}
                    onClick={() => setExpanded(expanded === date ? null : date)}>
                    <div>
                      <div className="card-title">📅 {date}</div>
                      <div className="card-subtitle">{assignments.length} interviews</div>
                    </div>
                    {expanded === date ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                  </div>
                  {expanded === date && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {assignments.sort((a, b) => a.start_time.localeCompare(b.start_time)).map(a => (
                        <div key={a.id} className="schedule-slot confirmed">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{a.candidate_name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {a.applied_role} · Round {a.round_num}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: 700, color: 'var(--primary-light)', fontSize: '0.9rem' }}>
                                {a.start_time} – {a.end_time}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{a.room_name}</div>
                            </div>
                          </div>
                          <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span>🎤 {a.interviewer_name}</span>
                            {a.department && <span>· {a.department}</span>}
                            <span className={`badge badge-${a.status === 'confirmed' ? 'success' : 'warning'}`} style={{ padding: '0.1rem 0.4rem', fontSize: '0.65rem' }}>{a.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </>
          ) : (
            <div className="card">
              <div className="empty-state"><div className="empty-state-icon">👈</div><h3>Select a schedule</h3><p>Click a schedule on the left to view details</p></div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
