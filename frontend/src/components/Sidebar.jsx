import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', icon: '⊞', label: 'Dashboard' },
  { to: '/projects', icon: '📂', label: 'Projects' },
  { to: '/tasks', icon: '☰', label: 'Tasks' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>Team Task<br/>Manager</h1>
      </div>

      <div className="sidebar-label">Menu</div>
      <nav className="sidebar-nav">
        {navItems.map(item => (
          <NavLink key={item.to} to={item.to}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-summary">
        <h3>Workspace summary</h3>
        <p>Manage team projects, track delivery, and keep assigned tasks moving from one board.</p>
      </div>

      <div className="sidebar-user">
        Signed in as {user?.role?.toLowerCase()}
      </div>
    </aside>
  );
}
