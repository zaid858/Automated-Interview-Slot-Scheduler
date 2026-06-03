/**
 * Shared availability selector component.
 * Used by both interviewer and candidate availability pages.
 * Props: role = 'interviewer' | 'candidate'
 */
import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import API from '../../services/api';
import { Save, Check } from 'lucide-react';

export default function AvailabilityPage({ role }) {
  const [slots, setSlots] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [profileId, setProfileId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const endpoint = role === 'interviewer' ? '/interviewers/me/profile' : '/candidates/me/profile';
    Promise.all([
      API.get('/slots'),
      API.get(endpoint),
    ]).then(([slotsRes, profileRes]) => {
      setSlots(slotsRes.data);
      setProfileId(profileRes.data.id);
      setSelected(new Set(profileRes.data.availability || []));
    }).finally(() => setLoading(false));
  }, [role]);

  const toggleSlot = (slotId, isBreak) => {
    if (isBreak) return;
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(slotId)) next.delete(slotId);
      else next.add(slotId);
      return next;
    });
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const endpoint = role === 'interviewer'
      ? `/interviewers/${profileId}/availability`
      : `/candidates/${profileId}/availability`;
    await API.put(endpoint, { slot_ids: [...selected] });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const grouped = slots.reduce((acc, s) => { (acc[s.date] = acc[s.date] || []).push(s); return acc; }, {});

  const totalAvail = selected.size;
  const totalSlots = slots.filter(s => !s.is_break).length;

  return (
    <Layout title="Set Availability" subtitle="Select the time slots when you are available">
      <div className="page-header">
        <div>
          <h2>Availability</h2>
          <p>{totalAvail} / {totalSlots} slots selected</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving || loading}>
          {saving ? <span className="spinner" style={{ width: 16, height: 16 }}/> : saved ? <Check size={16}/> : <Save size={16}/>}
          {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Availability'}
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', gap: '0.75rem', color: 'var(--text-muted)', alignItems: 'center', padding: '2rem' }}><span className="spinner"/>Loading slots...</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="card"><div className="empty-state"><div className="empty-state-icon">🕐</div><h3>No time slots configured</h3><p>Ask an admin to generate time slots for the interview drive</p></div></div>
      ) : (
        <div className="card">
          <div style={{ marginBottom: '1rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Click to select/deselect slots. ☕ = break time (cannot be selected).
          </div>
          {Object.entries(grouped).sort().map(([date, daySlots]) => (
            <div className="avail-date-section" key={date}>
              <div className="avail-date-label">📅 {date}</div>
              <div className="avail-slots">
                {daySlots.sort((a,b) => a.start_time.localeCompare(b.start_time)).map(s => (
                  <div key={s.id}
                    className={`avail-slot ${s.is_break ? 'break' : selected.has(s.id) ? 'selected' : ''}`}
                    onClick={() => toggleSlot(s.id, !!s.is_break)}
                    title={s.is_break ? 'Break time' : s.start_time}>
                    {s.is_break ? '☕' : '🕐'} {s.start_time}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
