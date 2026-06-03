import { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import API from '../../services/api';
import { Zap, CheckCircle, XCircle, AlertCircle, Clock, Activity } from 'lucide-react';

export default function GenerateSchedule() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [aiOnline, setAiOnline] = useState(null);
  const [name, setName] = useState('');
  const [readiness, setReadiness] = useState(null);

  // Check AI engine + readiness
  useEffect(() => {
    fetch('http://localhost:5001/api/health')
      .then(() => setAiOnline(true))
      .catch(() => setAiOnline(false));

    Promise.all([
      API.get('/candidates').then(r => r.data.filter(c => c.status === 'pending')),
      API.get('/interviewers').then(r => r.data),
      API.get('/rooms').then(r => r.data),
      API.get('/slots').then(r => r.data.filter(s => !s.is_break)),
    ]).then(([candidates, interviewers, rooms, slots]) => {
      setReadiness({ candidates, interviewers, rooms, slots });
    }).catch(() => {});
  }, []);

  const handleGenerate = async () => {
    setLoading(true); setResult(null);
    try {
      const res = await API.post('/schedule/generate', { name: name || undefined });
      setResult({ success: true, ...res.data });
    } catch (err) {
      setResult({ success: false, error: err.response?.data?.error || 'Generation failed' });
    } finally { setLoading(false); }
  };

  const checks = readiness ? [
    { label: 'Pending Candidates', ok: readiness.candidates.length > 0, count: readiness.candidates.length, need: 'At least 1 pending candidate' },
    { label: 'Interviewers', ok: readiness.interviewers.length > 0, count: readiness.interviewers.length, need: 'At least 1 interviewer' },
    { label: 'Rooms', ok: readiness.rooms.length > 0, count: readiness.rooms.length, need: 'At least 1 active room' },
    { label: 'Time Slots', ok: readiness.slots.length > 0, count: readiness.slots.length, need: 'Generate time slots first' },
    { label: 'AI Engine', ok: aiOnline === true, count: aiOnline ? 'Online' : 'Offline', need: 'Run: python app.py in ai-engine/' },
  ] : [];

  const allReady = checks.every(c => c.ok);

  return (
    <Layout title="Generate Schedule" subtitle="AI-powered interview scheduling engine">
      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Readiness Panel */}
        <div className="card">
          <div className="card-header"><div className="card-title">🔍 Pre-flight Check</div></div>
          {readiness === null ? (
            <div style={{ display: 'flex', gap: '0.75rem', color: 'var(--text-muted)', alignItems: 'center', padding: '1rem' }}><span className="spinner"/>Checking...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {checks.map(c => (
                <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.9rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-soft)' }}>
                  {c.ok ? <CheckCircle size={16} color="#34d399"/> : <XCircle size={16} color="#f87171"/>}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{c.label}</div>
                    {!c.ok && <div style={{ fontSize: '0.75rem', color: '#f87171' }}>{c.need}</div>}
                  </div>
                  <span style={{ fontSize: '0.8rem', color: c.ok ? '#34d399' : 'var(--text-dim)', fontWeight: 600 }}>{c.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Generator Panel */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">🤖 AI CSP Scheduler</div>
              <div className="card-subtitle">Backtracking + MRV + LCV + AC-3</div>
            </div>
            <div className={`ai-status ${aiOnline === true ? 'online' : 'offline'}`}>
              <span className="dot"/>
              {aiOnline === null ? 'Checking...' : aiOnline ? 'AI Online' : 'AI Offline'}
            </div>
          </div>

          <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 'var(--radius-sm)', padding: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              The AI engine will:
              <br/>① Run AC-3 to pre-reduce domains
              <br/>② Use Backtracking with MRV (hardest slot first)
              <br/>③ Order values using LCV (least constraining)
              <br/>④ Apply Forward Checking to detect failures early
              <br/>⑤ Optimize with Hill Climbing for soft constraints
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Schedule Name (optional)</label>
            <input className="form-input" placeholder="e.g. July 2025 Drive" value={name} onChange={e => setName(e.target.value)} />
          </div>

          <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }}
            onClick={handleGenerate} disabled={loading || !allReady}>
            {loading ? <><span className="spinner" style={{ width: 18, height: 18 }}/> Running CSP Solver...</>
            : <><Zap size={18}/> Generate Schedule</>}
          </button>

          {!allReady && readiness && (
            <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#f87171', textAlign: 'center' }}>
              ⚠️ Complete the pre-flight checks above first
            </div>
          )}

          {/* Result */}
          {result && (
            <div style={{ marginTop: '1.25rem', padding: '1.25rem', borderRadius: 'var(--radius-sm)', background: result.success ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${result.success ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
              {result.success ? (
                <>
                  <div style={{ fontWeight: 700, color: '#34d399', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle size={16}/> Schedule Generated!
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.82rem' }}>
                    {[
                      ['Total Interviews', result.total_interviews],
                      ['Quality Score', `${result.quality_score?.toFixed(1)}%`],
                      ['Backtracks', result.stats?.backtracks],
                      ['Solve Time', `${result.stats?.time_ms}ms`],
                    ].map(([k, v]) => (
                      <div key={k} style={{ background: 'rgba(255,255,255,0.04)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.1rem' }}>{k}</div>
                        <div style={{ fontWeight: 700 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  <a href="/admin/schedule" style={{ display: 'block', textAlign: 'center', marginTop: '0.75rem' }}>
                    <button className="btn btn-success" style={{ width: '100%', justifyContent: 'center' }}>View Schedule →</button>
                  </a>
                </>
              ) : (
                <div style={{ color: '#f87171' }}>
                  <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <XCircle size={16}/> Failed
                  </div>
                  <div style={{ fontSize: '0.82rem' }}>{result.error}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
