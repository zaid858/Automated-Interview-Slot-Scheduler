import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import API from '../../services/api';
import { Users, UserCheck, DoorOpen, Calendar, Clock, Zap, TrendingUp, CheckCircle } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/stats').then(r => setStats(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: 'Total Candidates', value: stats?.totalCandidates ?? 0, icon: '👥', color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
    { label: 'Scheduled', value: stats?.scheduled ?? 0, icon: '✅', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
    { label: 'Pending', value: stats?.pending ?? 0, icon: '⏳', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    { label: 'Interviewers', value: stats?.totalInterviewers ?? 0, icon: '🎤', color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' },
    { label: 'Rooms', value: stats?.totalRooms ?? 0, icon: '🚪', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
    { label: 'Available Slots', value: stats?.totalSlots ?? 0, icon: '🕐', color: '#ec4899', bg: 'rgba(236,72,153,0.12)' },
  ];

  return (
    <Layout title="Admin Dashboard" subtitle="Overview of all scheduling activity">
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)', padding: '2rem' }}>
          <span className="spinner" /> Loading...
        </div>
      ) : (
        <>
          <div className="stats-grid">
            {statCards.map((s) => (
              <div className="stat-card" key={s.label}>
                <div className="stat-icon" style={{ background: s.bg, color: s.color, fontSize: '1.5rem' }}>{s.icon}</div>
                <div className="stat-info">
                  <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Schedules */}
          <div className="card" style={{ marginTop: '1.5rem' }}>
            <div className="card-header">
              <div>
                <div className="card-title">Recent Schedules</div>
                <div className="card-subtitle">Last generated interview timetables</div>
              </div>
            </div>
            {stats?.recentSchedules?.length > 0 ? (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Status</th>
                      <th>Quality Score</th>
                      <th>Backtracks</th>
                      <th>Solve Time</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentSchedules.map(s => (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                        <td><span className={`badge badge-${s.status === 'confirmed' ? 'success' : 'warning'}`}>{s.status}</span></td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div className="progress-bar" style={{ width: '80px' }}>
                              <div className="progress-fill"
                                style={{ width: `${s.quality_score}%`, background: `linear-gradient(90deg, #6366f1, #06b6d4)` }} />
                            </div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.quality_score?.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>{s.backtracks}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{s.solve_time_ms}ms</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          {new Date(s.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📅</div>
                <h3>No schedules yet</h3>
                <p>Generate your first schedule using the AI engine</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="card" style={{ marginTop: '1.5rem' }}>
            <div className="card-header">
              <div className="card-title">Quick Start Guide</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              {[
                { step: '1', title: 'Add Candidates', desc: 'Register candidates with their availability', icon: '👥' },
                { step: '2', title: 'Add Interviewers', desc: 'Set up interviewers and their schedules', icon: '🎤' },
                { step: '3', title: 'Configure Rooms', desc: 'Add interview rooms and equipment', icon: '🚪' },
                { step: '4', title: 'Generate Slots', desc: 'Create available time slots for the drive', icon: '🕐' },
                { step: '5', title: 'Set Constraints', desc: 'Define scheduling rules and preferences', icon: '⚙️' },
                { step: '6', title: 'Generate Schedule', desc: 'Let AI create the optimal timetable', icon: '🤖' },
              ].map(item => (
                <div key={item.step} style={{
                  background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-soft)',
                  borderRadius: 'var(--radius-sm)', padding: '1rem'
                }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{item.icon}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
                    <span style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--primary-light)', borderRadius: '99px', fontSize: '0.65rem', fontWeight: 700, padding: '0.1rem 0.45rem' }}>Step {item.step}</span>
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>{item.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
