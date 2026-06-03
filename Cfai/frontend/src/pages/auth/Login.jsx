import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogIn, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const user = await login(form.email, form.password);
      if (user.role === 'candidate') navigate('/candidate');
      else if (user.role === 'interviewer') navigate('/interviewer');
      else navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check credentials.');
    } finally { setLoading(false); }
  };

  const fillDemo = (email, password) => setForm({ email, password });

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">🤖</div>
          <h1>AI Interview Scheduler</h1>
          <p>Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-input" type="email" placeholder="you@example.com"
              value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input className="form-input" type={showPass ? 'text' : 'password'}
                placeholder="••••••••" value={form.password}
                onChange={e => setForm({...form, password: e.target.value})} required
                style={{ paddingRight: '2.5rem' }} />
              <button type="button" onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', display: 'flex' }}>
                {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
          </div>
          {error && <div className="form-error" style={{ marginBottom: '1rem' }}>{error}</div>}
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} type="submit" disabled={loading}>
            {loading ? <span className="spinner" style={{ width: 16, height: 16 }}/> : <LogIn size={16}/>}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-divider">— Demo Accounts —</div>
        <div style={{ display: 'grid', grid: 'auto / 1fr 1fr', gap: '0.5rem', marginBottom: '1.25rem' }}>
          {[
            { label: '👑 Admin', e: 'admin@scheduler.com', p: 'admin123' },
            { label: '🧑‍💼 HR', e: 'hr@scheduler.com', p: 'hr1234' },
            { label: '🎤 Interviewer', e: 'priya@scheduler.com', p: 'pass123' },
            { label: '👤 Candidate', e: 'alice@candidate.com', p: 'pass123' },
          ].map(d => (
            <button key={d.e} onClick={() => fillDemo(d.e, d.p)}
              className="btn btn-secondary btn-sm" style={{ justifyContent: 'center', fontSize: '0.75rem' }}>
              {d.label}
            </button>
          ))}
        </div>

        <div style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          No account? <Link to="/register" className="auth-link">Register here</Link>
        </div>
      </div>
    </div>
  );
}
