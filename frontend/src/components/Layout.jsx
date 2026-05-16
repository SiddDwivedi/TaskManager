import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children, title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="top-bar">
          <span className="top-bar-title">{title || 'Dashboard'}</span>
          <input className="top-bar-search" placeholder="Manage projects, assigned work, and delivery progress from one place." readOnly />
          <div className="top-bar-actions">
            <div className="top-bar-icon">
              🔔
              <span className="notification-dot" />
            </div>
            <div style={{ position: 'relative' }}>
              <div className="avatar" onClick={() => setShowMenu(!showMenu)}
                style={{ background: user?.avatarColor || '#14b8a6', cursor: 'pointer', width: 38, height: 38 }}>
                {initials}
              </div>
              {showMenu && (
                <div style={{
                  position: 'absolute', top: 46, right: 0, background: '#fff',
                  border: '1px solid var(--border)', borderRadius: 12, padding: 8,
                  boxShadow: '0 8px 30px rgba(0,0,0,0.12)', minWidth: 160, zIndex: 100,
                }}>
                  <div style={{ padding: '8px 12px', fontSize: 13, fontWeight: 600 }}>{user?.name}</div>
                  <div style={{ padding: '4px 12px', fontSize: 12, color: 'var(--text-muted)' }}>{user?.email}</div>
                  <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />
                  <button onClick={() => { navigate('/profile'); setShowMenu(false); }}
                    style={{ width: '100%', padding: '8px 12px', background: 'none', border: 'none', textAlign: 'left', fontSize: 13, cursor: 'pointer', borderRadius: 8 }}>
                    👤 Profile
                  </button>
                  {user?.role === 'ADMIN' && (
                    <button onClick={() => { navigate('/team'); setShowMenu(false); }}
                      style={{ width: '100%', padding: '8px 12px', background: 'none', border: 'none', textAlign: 'left', fontSize: 13, cursor: 'pointer', borderRadius: 8 }}>
                      👥 Team
                    </button>
                  )}
                  <button onClick={() => { logout(); navigate('/login'); }}
                    style={{ width: '100%', padding: '8px 12px', background: 'none', border: 'none', textAlign: 'left', fontSize: 13, color: '#ef4444', cursor: 'pointer', borderRadius: 8 }}>
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="main-inner fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
