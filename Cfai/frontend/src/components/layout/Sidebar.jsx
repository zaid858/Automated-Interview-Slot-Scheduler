import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, UserCheck, DoorOpen, Clock,
  Settings, Calendar, Zap, LogOut, Bell, FileText, User
} from 'lucide-react';

const NAV_CONFIG = {
  admin: [
    { section: 'Overview', items: [{ to: '/admin', icon: LayoutDashboard, label: 'Dashboard' }] },
    { section: 'Management', items: [
      { to: '/admin/candidates', icon: Users, label: 'Candidates' },
      { to: '/admin/interviewers', icon: UserCheck, label: 'Interviewers' },
      { to: '/admin/rooms', icon: DoorOpen, label: 'Rooms' },
      { to: '/admin/slots', icon: Clock, label: 'Time Slots' },
      { to: '/admin/constraints', icon: Settings, label: 'Constraints' },
    ]},
    { section: 'Scheduling', items: [
      { to: '/admin/generate', icon: Zap, label: 'Generate Schedule' },
      { to: '/admin/schedule', icon: Calendar, label: 'View Schedule' },
    ]},
  ],
  hr: [
    { section: 'Overview', items: [{ to: '/admin', icon: LayoutDashboard, label: 'Dashboard' }] },
    { section: 'My Tasks', items: [
      { to: '/admin/candidates', icon: Users, label: 'Candidates' },
    ]},
    { section: 'Scheduling', items: [
      { to: '/admin/generate', icon: Zap, label: 'Generate Schedule' },
      { to: '/admin/schedule', icon: Calendar, label: 'View Schedule' },
    ]},
  ],
  interviewer: [
    { section: 'Overview', items: [{ to: '/interviewer', icon: LayoutDashboard, label: 'Dashboard' }] },
    { section: 'My Work', items: [
      { to: '/interviewer/schedule', icon: Calendar, label: 'My Schedule' },
      { to: '/interviewer/availability', icon: Clock, label: 'Availability' },
    ]},
  ],
  candidate: [
    { section: 'Overview', items: [{ to: '/candidate', icon: LayoutDashboard, label: 'Dashboard' }] },
    { section: 'My Interviews', items: [
      { to: '/candidate/interviews', icon: Calendar, label: 'My Interviews' },
      { to: '/candidate/availability', icon: Clock, label: 'Set Availability' },
    ]},
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navSections = NAV_CONFIG[user?.role] || [];

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🤖</div>
        <div>
          <div className="sidebar-logo-text">AI Scheduler</div>
          <div className="sidebar-logo-sub">Interview Platform</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navSections.map((section) => (
          <div key={section.section}>
            <div className="nav-section-label">{section.section}</div>
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = item.to === '/admin'
                ? location.pathname === '/admin'
                : location.pathname.startsWith(item.to);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                >
                  <Icon size={16} />
                  {item.label}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user" onClick={logout} title="Logout">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{user?.name}</div>
            <div className="user-role">{user?.role}</div>
          </div>
          <LogOut size={14} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
        </div>
      </div>
    </aside>
  );
}
