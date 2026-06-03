import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserPlus } from 'lucide-react';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'candidate' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const user = await register(form.name, form.email, form.password, form.role);
      if (user.role === 'candidate') navigate('/candidate');
      else if (user.role === 'interviewer') navigate('/interviewer');
      else navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">🤖</div>
          <h1>Create Account</h1>
          <p>Join the AI Interview Scheduler</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" placeholder="John Smith" value={form.name}
              onChange={e => setForm({...form, name: e.target.value})} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" placeholder="you@example.com"
              value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="Min. 6 characters"
              value={form.password} onChange={e => setForm({...form, password: e.target.value})} required minLength={6} />
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-select" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
              <option value="candidate">Candidate</option>
              <option value="interviewer">Interviewer</option>
              <option value="hr">HR Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {error && <div className="form-error" style={{ marginBottom: '1rem' }}>{error}</div>}
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} type="submit" disabled={loading}>
            {loading ? <span className="spinner" style={{ width: 16, height: 16 }}/> : <UserPlus size={16}/>}
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '1.25rem' }}>
          Already have an account? <Link to="/login" className="auth-link">Sign In</Link>
        </div>
      </div>
    </div>
  );
}
