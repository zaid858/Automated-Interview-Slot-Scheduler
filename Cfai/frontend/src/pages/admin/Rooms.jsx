import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import API from '../../services/api';
import { Plus, Edit2, Trash2 } from 'lucide-react';

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editRoom, setEditRoom] = useState(null);
  const [form, setForm] = useState({ name: '', capacity: 2, equipment: '' });
  const [error, setError] = useState('');

  const fetch = () => { setLoading(true); API.get('/rooms').then(r => setRooms(r.data)).finally(() => setLoading(false)); };
  useEffect(() => { fetch(); }, []);

  const openAdd = () => { setEditRoom(null); setForm({ name: '', capacity: 2, equipment: '' }); setError(''); setModal(true); };
  const openEdit = (r) => { setEditRoom(r); setForm({ name: r.name, capacity: r.capacity, equipment: (r.equipment||[]).join(', ') }); setError(''); setModal(true); };

  const handleSave = async () => {
    setError('');
    try {
      const payload = { ...form, capacity: +form.capacity, equipment: form.equipment.split(',').map(s=>s.trim()).filter(Boolean) };
      if (editRoom) await API.put(`/rooms/${editRoom.id}`, payload);
      else await API.post('/rooms', payload);
      setModal(false); fetch();
    } catch(err) { setError(err.response?.data?.error || 'Failed to save room'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this room?')) return;
    await API.delete(`/rooms/${id}`); fetch();
  };

  return (
    <Layout title="Rooms" subtitle="Manage interview rooms">
      <div className="page-header">
        <div><h2>Rooms</h2><p>{rooms.length} active rooms</p></div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16}/> Add Room</button>
      </div>
      <div className="grid-3">
        {loading ? <div style={{ padding: '2rem', color: 'var(--text-muted)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}><span className="spinner"/>Loading...</div>
        : rooms.length === 0 ? <div className="empty-state" style={{ gridColumn: '1/-1' }}><div className="empty-state-icon">🚪</div><h3>No rooms added</h3></div>
        : rooms.map(r => (
          <div className="card" key={r.id} style={{ position: 'relative' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🚪</div>
            <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.3rem' }}>{r.name}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Capacity: {r.capacity} people</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1rem' }}>
              {(r.equipment||[]).map(e => <span key={e} className="badge badge-default" style={{ fontSize: '0.68rem' }}>{e}</span>)}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => openEdit(r)}><Edit2 size={12}/> Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r.id)}><Trash2 size={12}/></button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editRoom ? 'Edit Room' : 'Add Room'}</h2>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Room Name</label>
                <input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Room A" required /></div>
              <div className="form-group"><label className="form-label">Capacity</label>
                <input className="form-input" type="number" min="1" value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})} /></div>
              <div className="form-group"><label className="form-label">Equipment (comma-separated)</label>
                <input className="form-input" value={form.equipment} onChange={e => setForm({...form, equipment: e.target.value})} placeholder="Whiteboard, Projector, Webcam" /></div>
              {error && <div className="form-error">{error}</div>}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>Save</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
