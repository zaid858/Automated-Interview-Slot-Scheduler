import { useEffect, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import API from '../../services/api';

export default function TopBar({ title, subtitle }) {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    API.get('/notifications/unread-count')
      .then(r => setUnread(r.data.count))
      .catch(() => {});
  }, []);

  return (
    <header className="topbar">
      <div className="topbar-title">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="topbar-actions">
        <div className="notif-bell">
          <button className="notif-icon-btn" title="Notifications">
            <Bell size={18} />
          </button>
          {unread > 0 && <span className="notif-badge">{unread > 9 ? '9+' : unread}</span>}
        </div>
      </div>
    </header>
  );
}
