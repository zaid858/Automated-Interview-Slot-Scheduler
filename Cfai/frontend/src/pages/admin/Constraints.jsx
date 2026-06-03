import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import API from '../../services/api';
import { Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

export default function Constraints() {
  const [constraints, setConstraints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ type: 'hard', category: '', label: '', value: 'true' });

  const fetch = () => { setLoading(true); API.get('/constraints').then(r => setConstraints(r.data)).finally(() => setLoading(false)); };
  useEffect(() => { fetch(); }, []);

  const handleAdd = async () => {
    await API.post('/constraints', form);
    setModal(false); fetch();
  };

  const handleDelete = async (id) => { await API.delete(`/constraints/${id}`); fetch(); };

  const toggleActive = async (c) => {
    await API.put(`/constraints/${c.id}`, { ...c, is_active: c.is_active ? 0 : 1 });
    fetch();
  };

  const hard = constraints.filter(c => c.type === 'hard');
  const soft = constraints.filter(c => c.type === 'soft');

  return (
    <Layout title="Constraints" subtitle="Define scheduling rules and preferences">
      <div className="page-header">
        <div><h2>Constraints</h2><p>{hard.length} hard, {soft.length} soft constraints</p></div>
        <button className="btn btn-primary" onClick={() => setModal(true)}><Plus size={16}/> Add Constraint</button>
      </div>

      {['hard', 'soft'].map(type => (
        <div className="card" key={type} style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <div>
              <div className="card-title">{type === 'hard' ? '🔒 Hard Constraints' : '🎯 Soft Constraints'}</div>
              <div className="card-subtitle">{type === 'hard' ? 'Must be satisfied — no exceptions' : 'Preferred but can be relaxed'}</div>
            </div>
          </div>
          {loading ? <div style={{ padding: '1rem', color: 'var(--text-muted)' }}>Loading...</div>
          : constraints.filter(c => c.type === type).length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">{type === 'hard' ? '🔒' : '🎯'}</div><h3>No {type} constraints</h3></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {constraints.filter(c => c.type === type).map(c => (
                <div key={c.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.8rem 1rem',
                  background: c.is_active ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.01)',
                  border: `1px solid ${c.is_active ? 'var(--border-soft)' : 'transparent'}`,
                  borderRadius: 'var(--radius-sm)',
                  opacity: c.is_active ? 1 : 0.45,
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{c.label}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Category: {c.category} · Value: <code style={{ background: 'rgba(255,255,255,0.06)', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>{c.value}</code>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button onClick={() => toggleActive(c)}
                      style={{ background: 'none', border: 'none', color: c.is_active ? '#34d399' : 'var(--text-dim)', cursor: 'pointer', display: 'flex' }}>
                      {c.is_active ? <ToggleRight size={20}/> : <ToggleLeft size={20}/>}
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}><Trash2 size={12}/></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Add Constraint</h2><button className="modal-close" onClick={() => setModal(false)}>✕</button></div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group"><label className="form-label">Type</label>
                  <select className="form-select" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                    <option value="hard">Hard</option><option value="soft">Soft</option>
                  </select></div>
                <div className="form-group"><label className="form-label">Category</label>
                  <input className="form-input" value={form.category} onChange={e => setForm({...form, category: e.target.value})} placeholder="e.g. no_overlap" /></div>
              </div>
              <div className="form-group"><label className="form-label">Label (description)</label>
                <input className="form-input" value={form.label} onChange={e => setForm({...form, label: e.target.value})} placeholder="No interviewer double booking" /></div>
              <div className="form-group"><label className="form-label">Value</label>
                <input className="form-input" value={form.value} onChange={e => setForm({...form, value: e.target.value})} placeholder="true / false / number" /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAdd}>Add Constraint</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
