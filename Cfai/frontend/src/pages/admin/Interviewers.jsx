import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import API from '../../services/api';
import { Edit2, Search } from 'lucide-react';

export default function Interviewers() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ department: '', expertise: '', max_per_day: 5 });

  const fetch = () => {
    setLoading(true);
    API.get('/interviewers').then(r => setList(r.data)).finally(() => setLoading(false));
  };
  useEffect(() => { fetch(); }, []);

  const openEdit = (iv) => {
    setSelected(iv);
    setForm({ department: iv.department || '', expertise: (iv.expertise || []).join(', '), max_per_day: iv.max_per_day || 5 });
    setModal(true);
  };

  const handleSave = async () => {
    await API.put(`/interviewers/${selected.id}`, {
      ...form, expertise: form.expertise.split(',').map(s => s.trim()).filter(Boolean)
    });
    setModal(false); fetch();
  };

  const filtered = list.filter(iv =>
    iv.name?.toLowerCase().includes(search.toLowerCase()) ||
    iv.department?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout title="Interviewers" subtitle="Manage interview panel members">
      <div className="page-header">
        <div><h2>Interviewers</h2><p>{list.length} registered interviewers</p></div>
      </div>
      <div className="card">
        <div className="card-header">
          <div style={{ position: 'relative', maxWidth: 320 }}>
            <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input className="form-input" placeholder="Search interviewers..." style={{ paddingLeft: '2.25rem' }}
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '2rem', color: 'var(--text-muted)' }}><span className="spinner" /> Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">🎤</div><h3>No interviewers found</h3><p>Interviewers registered via Register page appear here</p></div>
        ) : (
          <div className="table-container">
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Department</th><th>Expertise</th><th>Max/Day</th><th>Avail. Slots</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map(iv => (
                  <tr key={iv.id}>
                    <td style={{ fontWeight: 600 }}>{iv.name}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{iv.email}</td>
                    <td>{iv.department || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                        {(iv.expertise || []).slice(0, 3).map(e => (
                          <span key={e} className="badge badge-info" style={{ fontSize: '0.65rem' }}>{e}</span>
                        ))}
                      </div>
                    </td>
                    <td>{iv.max_per_day}</td>
                    <td>{(iv.availability || []).length}</td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(iv)}><Edit2 size={13}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit — {selected?.name}</h2>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Department</label>
                <input className="form-input" value={form.department} onChange={e => setForm({...form, department: e.target.value})} placeholder="e.g. Engineering" />
              </div>
              <div className="form-group">
                <label className="form-label">Expertise (comma-separated)</label>
                <input className="form-input" value={form.expertise} onChange={e => setForm({...form, expertise: e.target.value})} placeholder="Python, AI, Machine Learning" />
              </div>
              <div className="form-group">
                <label className="form-label">Max Interviews per Day</label>
                <input className="form-input" type="number" min="1" max="10" value={form.max_per_day} onChange={e => setForm({...form, max_per_day: +e.target.value})} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
