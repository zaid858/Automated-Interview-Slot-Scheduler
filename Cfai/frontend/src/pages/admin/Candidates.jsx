import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import API from '../../services/api';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';

export default function Candidates() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | 'edit' | 'add'
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ applied_role: '', experience_yrs: 0, priority: 5, rounds: 1, status: 'pending' });
  const [addForm, setAddForm] = useState({ name: '', email: '', password: '', applied_role: '', experience_yrs: 0, priority: 5, rounds: 1 });
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // candidate to confirm-delete

  const fetchCandidates = () => {
    setLoading(true);
    API.get('/candidates').then(r => setCandidates(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchCandidates(); }, []);

  const openEdit = (c) => {
    setSelected(c);
    setForm({ applied_role: c.applied_role || '', experience_yrs: c.experience_yrs, priority: c.priority, rounds: c.rounds, status: c.status });
    setModal('edit');
  };

  const openAdd = () => {
    setAddForm({ name: '', email: '', password: '', applied_role: '', experience_yrs: 0, priority: 5, rounds: 1 });
    setAddError('');
    setModal('add');
  };

  const handleAdd = async () => {
    const { name, email, password, applied_role, experience_yrs, priority, rounds } = addForm;
    if (!name || !email || !password) { setAddError('Name, email and password are required.'); return; }
    setAddLoading(true); setAddError('');
    try {
      // Step 1: Register user with role=candidate (backend auto-creates candidate profile)
      await API.post('/auth/register', { name, email, password, role: 'candidate' });

      // Step 2: Get the newly created candidate profile
      const profileRes = await API.get('/candidates');
      const newCandidate = profileRes.data.find(c => c.email === email);

      if (newCandidate) {
        // Step 3: Update profile with job details
        await API.put(`/candidates/${newCandidate.id}`, {
          applied_role, experience_yrs: +experience_yrs,
          priority: +priority, rounds: +rounds, status: 'pending'
        });

        // Step 4: Auto-assign ALL existing time slots so candidate is immediately schedulable
        const slotsRes = await API.get('/slots');
        const allSlotIds = slotsRes.data
          .filter(s => !s.is_break)        // exclude break slots
          .map(s => s.id);
        if (allSlotIds.length > 0) {
          await API.put(`/candidates/${newCandidate.id}/availability`, { slot_ids: allSlotIds });
        }
      }
      setModal(null); fetchCandidates();
    } catch (err) {
      setAddError(err.response?.data?.error || 'Failed to add candidate.');
    } finally { setAddLoading(false); }
  };

  const handleSave = async () => {
    await API.put(`/candidates/${selected.id}`, form);
    setModal(null); fetchCandidates();
  };

  const handleDelete = (c) => {
    setDeleteTarget(c); // open confirmation modal
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await API.delete(`/candidates/${deleteTarget.id}`);
      fetchCandidates();
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeleteTarget(null);
    }
  };

  const filtered = candidates.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.applied_role?.toLowerCase().includes(search.toLowerCase())
  );

  const statusBadge = (s) => {
    const map = { pending: 'badge-warning', scheduled: 'badge-success', completed: 'badge-info', cancelled: 'badge-danger' };
    return map[s] || 'badge-default';
  };

  return (
    <Layout title="Candidates" subtitle="Manage interview candidates">
      <div className="page-header">
        <div><h2>Candidates</h2><p>{candidates.length} total candidates</p></div>
        <button className="btn btn-primary" onClick={openAdd} id="add-candidate-btn">
          <Plus size={15} /> Add Candidate
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
            <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input className="form-input" placeholder="Search candidates..."
              style={{ paddingLeft: '2.25rem' }} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '2rem', color: 'var(--text-muted)' }}>
            <span className="spinner" /> Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <h3>No candidates found</h3>
            <p>Candidates registered via the Register page will appear here</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th><th>Email</th><th>Applied Role</th>
                  <th>Exp (yrs)</th><th>Priority</th><th>Rounds</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{c.email}</td>
                    <td>{c.applied_role || '—'}</td>
                    <td>{c.experience_yrs}</td>
                    <td>
                      <span style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--primary-light)', borderRadius: '99px', padding: '0.2rem 0.6rem', fontSize: '0.75rem', fontWeight: 700 }}>
                        P{c.priority}
                      </span>
                    </td>
                    <td>{c.rounds}</td>
                    <td><span className={`badge ${statusBadge(c.status)}`}>{c.status}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)} title="Edit"><Edit2 size={13}/></button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c)} title="Delete"><Trash2 size={13}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {modal === 'edit' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Candidate — {selected?.name}</h2>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Applied Role</label>
                <input className="form-input" value={form.applied_role} onChange={e => setForm({...form, applied_role: e.target.value})} placeholder="e.g. Software Engineer" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Experience (years)</label>
                  <input className="form-input" type="number" min="0" value={form.experience_yrs} onChange={e => setForm({...form, experience_yrs: +e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Priority (1=Highest)</label>
                  <input className="form-input" type="number" min="1" max="10" value={form.priority} onChange={e => setForm({...form, priority: +e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Interview Rounds</label>
                  <input className="form-input" type="number" min="1" max="5" value={form.rounds} onChange={e => setForm({...form, rounds: +e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                    <option value="pending">Pending</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
      {/* Add Candidate Modal */}
      {modal === 'add' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Candidate</h2>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '8px', padding: '0.65rem 1rem', color: 'var(--primary-light)', fontSize: '0.82rem', marginBottom: '1rem' }}>
                ℹ️ All available time slots will be auto-assigned to this candidate so they can be scheduled immediately.
              </div>
              {addError && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#f87171', marginBottom: '1rem', fontSize: '0.85rem' }}>{addError}</div>}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" value={addForm.name} onChange={e => setAddForm({...addForm, name: e.target.value})} placeholder="e.g. John Smith" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input className="form-input" type="email" value={addForm.email} onChange={e => setAddForm({...addForm, email: e.target.value})} placeholder="john@example.com" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Password *</label>
                <input className="form-input" type="password" value={addForm.password} onChange={e => setAddForm({...addForm, password: e.target.value})} placeholder="Candidate login password" />
              </div>
              <div className="form-group">
                <label className="form-label">Applied Role</label>
                <input className="form-input" value={addForm.applied_role} onChange={e => setAddForm({...addForm, applied_role: e.target.value})} placeholder="e.g. Software Engineer" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Experience (years)</label>
                  <input className="form-input" type="number" min="0" value={addForm.experience_yrs} onChange={e => setAddForm({...addForm, experience_yrs: +e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Priority (1=Highest)</label>
                  <input className="form-input" type="number" min="1" max="10" value={addForm.priority} onChange={e => setAddForm({...addForm, priority: +e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Interview Rounds</label>
                  <input className="form-input" type="number" min="1" max="5" value={addForm.rounds} onChange={e => setAddForm({...addForm, rounds: +e.target.value})} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAdd} disabled={addLoading}>
                {addLoading ? <><span className="spinner" /> Adding...</> : <><Plus size={14}/> Add Candidate</>}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Candidate</h2>
              <button className="modal-close" onClick={() => setDeleteTarget(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Are you sure you want to delete <strong style={{ color: 'var(--text)' }}>{deleteTarget.name}</strong>?
                <br />This will permanently remove their profile and cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={confirmDelete}>
                <Trash2 size={14}/> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
