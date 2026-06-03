import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import API from '../../services/api';
import { Trash2, RefreshCw, Zap } from 'lucide-react';

export default function Slots() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({
    start_date: '', end_date: '',
    start_hour: 9, end_hour: 17, duration: 60,
    exclude_weekends: true, break_times: '12:00',
  });

  const fetch = () => { setLoading(true); API.get('/slots').then(r => setSlots(r.data)).finally(() => setLoading(false)); };
  useEffect(() => { fetch(); }, []);

  const handleGenerate = async (e) => {
    e.preventDefault(); setGenerating(true); setMsg('');
    try {
      const payload = {
        ...form,
        start_hour: +form.start_hour,
        end_hour: +form.end_hour,
        duration: +form.duration,
        break_times: form.break_times.split(',').map(s => s.trim()).filter(Boolean),
      };
      const res = await API.post('/slots/generate', payload);
      setMsg(`✅ Generated ${res.data.generated} new slots`);
      fetch();
    } catch (err) { setMsg(`❌ ${err.response?.data?.error || 'Failed'}`); }
    finally { setGenerating(false); }
  };

  const handleDelete = async (id) => { await API.delete(`/slots/${id}`); fetch(); };

  // Group by date
  const grouped = slots.reduce((acc, s) => { (acc[s.date] = acc[s.date] || []).push(s); return acc; }, {});

  return (
    <Layout title="Time Slots" subtitle="Configure available interview time slots">
      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Generator */}
        <div className="card">
          <div className="card-header"><div className="card-title">⚡ Generate Slots</div></div>
          <form onSubmit={handleGenerate}>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Start Date</label>
                <input className="form-input" type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} required /></div>
              <div className="form-group"><label className="form-label">End Date</label>
                <input className="form-input" type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} required /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Start Hour</label>
                <input className="form-input" type="number" min="0" max="23" value={form.start_hour} onChange={e => setForm({...form, start_hour: e.target.value})} /></div>
              <div className="form-group"><label className="form-label">End Hour</label>
                <input className="form-input" type="number" min="1" max="24" value={form.end_hour} onChange={e => setForm({...form, end_hour: e.target.value})} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Duration (min)</label>
                <input className="form-input" type="number" min="30" max="180" value={form.duration} onChange={e => setForm({...form, duration: e.target.value})} /></div>
              <div className="form-group"><label className="form-label">Break Start Times (comma-sep)</label>
                <input className="form-input" value={form.break_times} onChange={e => setForm({...form, break_times: e.target.value})} placeholder="12:00,13:00" /></div>
            </div>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.exclude_weekends} onChange={e => setForm({...form, exclude_weekends: e.target.checked})} />
                <span className="form-label" style={{ margin: 0 }}>Exclude Weekends</span>
              </label>
            </div>
            {msg && <div style={{ fontSize: '0.85rem', marginBottom: '1rem', padding: '0.6rem 0.9rem', background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-sm)' }}>{msg}</div>}
            <button className="btn btn-primary" type="submit" disabled={generating} style={{ width: '100%', justifyContent: 'center' }}>
              {generating ? <span className="spinner" style={{ width: 16, height: 16 }}/> : <Zap size={16}/>}
              {generating ? 'Generating...' : 'Generate Slots'}
            </button>
          </form>
        </div>

        {/* Slot List */}
        <div className="card">
          <div className="card-header">
            <div><div className="card-title">📅 Generated Slots</div><div className="card-subtitle">{slots.length} total</div></div>
            <button className="btn btn-secondary btn-sm" onClick={fetch}><RefreshCw size={13}/></button>
          </div>
          {loading ? (
            <div style={{ display: 'flex', gap: '0.75rem', color: 'var(--text-muted)', alignItems: 'center', padding: '1rem' }}><span className="spinner"/>Loading...</div>
          ) : Object.keys(grouped).length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">🕐</div><h3>No slots generated</h3></div>
          ) : (
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {Object.entries(grouped).sort().map(([date, daySlots]) => (
                <div key={date} className="avail-date-section">
                  <div className="avail-date-label">{date}</div>
                  <div className="avail-slots">
                    {daySlots.map(s => (
                      <div key={s.id} className={`avail-slot ${s.is_break ? 'break' : 'selected'}`}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {s.is_break ? '☕' : '🕐'} {s.start_time}
                        {!s.is_break && (
                          <button onClick={() => handleDelete(s.id)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: 0, display: 'flex' }}>
                            <Trash2 size={10}/>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
