import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../api/client';

export default function Layout({ children, title }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ tasks: [], projects: [] });
  const [showSearch, setShowSearch] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const notifRef = useRef(null);
  const menuRef = useRef(null);
  const searchRef = useRef(null);
  const searchTimer = useRef(null);

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearch(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounced search
  const doSearch = useCallback(async (q) => {
    if (!q || q.length < 2) { setSearchResults({ tasks: [], projects: [] }); setShowSearch(false); return; }
    setSearchLoading(true);
    setShowSearch(true);
    try {
      const [tasksRes, projectsRes] = await Promise.all([
        api.get('/tasks', { params: { search: q } }).catch(() => ({ data: { tasks: [] } })),
        api.get('/projects').catch(() => ({ data: { projects: [] } })),
      ]);
      const qLower = q.toLowerCase();
      const tasks = (tasksRes.data.tasks || []).slice(0, 5);
      const projects = (projectsRes.data.projects || []).filter(p =>
        p.name.toLowerCase().includes(qLower) || (p.description || '').toLowerCase().includes(qLower)
      ).slice(0, 4);
      setSearchResults({ tasks, projects });
    } catch {
      setSearchResults({ tasks: [], projects: [] });
    } finally { setSearchLoading(false); }
  }, []);

  const handleSearchChange = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => doSearch(q), 300);
  };

  const handleSearchSelect = (path) => {
    setShowSearch(false);
    setSearchQuery('');
    navigate(path);
  };

  const loadNotifications = async () => {
    if (showNotif) { setShowNotif(false); return; }
    setShowNotif(true);
    setNotifLoading(true);
    try {
      const res = await api.get('/dashboard');
      const items = [];
      if (res.data.stats.overdueTasks > 0) {
        items.push({ id: 'overdue', type: 'warning', icon: '⚠️', text: `${res.data.stats.overdueTasks} task(s) are overdue`, time: 'Now', link: '/tasks' });
      }
      (res.data.recentTasks || []).slice(0, 5).forEach(t => {
        items.push({
          id: t.id, type: 'task', icon: '📋', text: t.title,
          sub: `${t.project?.name || ''} · ${t.status.replace('_', ' ')}`,
          time: timeAgo(t.createdAt), link: `/tasks/${t.id}`,
        });
      });
      (res.data.upcomingTasks || []).slice(0, 3).forEach(t => {
        items.push({
          id: 'up-' + t.id, type: 'upcoming', icon: '⏰',
          text: `"${t.title}" due ${new Date(t.dueDate).toLocaleDateString()}`,
          time: 'Upcoming', link: `/tasks/${t.id}`,
        });
      });
      setNotifications(items);
    } catch { setNotifications([]); }
    finally { setNotifLoading(false); }
  };

  const totalResults = searchResults.tasks.length + searchResults.projects.length;

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="top-bar">
          <span className="top-bar-title">{title || 'Dashboard'}</span>

          {/* Search */}
          <div ref={searchRef} style={{ position: 'relative', flex: 1, maxWidth: 480, margin: '0 20px' }}>
            <span style={{
              position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
              fontSize: 14, color: 'var(--text-muted)', pointerEvents: 'none', zIndex: 1,
            }}>🔍</span>
            <input
              className="top-bar-search"
              placeholder="Search tasks, projects..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => { if (searchQuery.length >= 2) setShowSearch(true); }}
              style={{ width: '100%', margin: 0, paddingLeft: 38 }}
            />
            {showSearch && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 6,
                background: 'var(--dropdown-bg)', border: '1px solid var(--border)',
                borderRadius: 14, boxShadow: 'var(--shadow-lg)', zIndex: 300,
                maxHeight: 380, overflow: 'hidden',
              }}>
                {searchLoading && (
                  <div style={{ padding: 24, textAlign: 'center' }}><div className="spinner spinner-sm" style={{ margin: '0 auto' }} /></div>
                )}
                {!searchLoading && totalResults === 0 && (
                  <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                    No results for "{searchQuery}"
                  </div>
                )}
                {!searchLoading && searchResults.projects.length > 0 && (
                  <>
                    <div style={{ padding: '10px 16px 4px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Projects</div>
                    {searchResults.projects.map(p => (
                      <div key={p.id} onClick={() => handleSearchSelect(`/projects/${p.id}`)} style={{
                        padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                        transition: 'background 0.15s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--table-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <span style={{ fontSize: 16 }}>📁</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
                          {p.description && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{p.description.slice(0, 60)}</div>}
                        </div>
                      </div>
                    ))}
                  </>
                )}
                {!searchLoading && searchResults.tasks.length > 0 && (
                  <>
                    <div style={{ padding: '10px 16px 4px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', borderTop: searchResults.projects.length ? '1px solid var(--border-light)' : 'none' }}>Tasks</div>
                    {searchResults.tasks.map(t => (
                      <div key={t.id} onClick={() => handleSearchSelect(`/tasks/${t.id}`)} style={{
                        padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                        transition: 'background 0.15s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--table-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <span style={{
                          width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                          background: t.status === 'DONE' ? 'var(--done)' : t.status === 'OVERDUE' ? 'var(--overdue)' : t.status === 'IN_PROGRESS' ? 'var(--in-progress)' : 'var(--todo)',
                        }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{t.title}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                            {t.project?.name || ''} · {t.status.replace('_', ' ')} · {t.priority}
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          <div className="top-bar-actions">
            {/* Theme Toggle */}
            <div className="top-bar-icon" onClick={toggleTheme} title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
              {theme === 'light' ? '🌙' : '☀️'}
            </div>
            {/* Notification Bell */}
            <div ref={notifRef} style={{ position: 'relative' }}>
              <div className="top-bar-icon" onClick={loadNotifications}>
                🔔
                <span className="notification-dot" />
              </div>
              {showNotif && (
                <div style={{
                  position: 'absolute', top: 46, right: 0, background: 'var(--dropdown-bg)',
                  border: '1px solid var(--border)', borderRadius: 16, padding: 0,
                  boxShadow: '0 8px 30px rgba(0,0,0,0.12)', width: 340, zIndex: 200,
                  maxHeight: 420, overflow: 'hidden',
                }}>
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-light)', fontWeight: 700, fontSize: 15 }}>
                    Notifications
                  </div>
                  <div style={{ maxHeight: 340, overflowY: 'auto' }}>
                    {notifLoading && <div style={{ padding: 24, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>}
                    {!notifLoading && notifications.length === 0 && (
                      <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                        ✅ All caught up! No notifications.
                      </div>
                    )}
                    {!notifLoading && notifications.map(n => (
                      <Link to={n.link} key={n.id} onClick={() => setShowNotif(false)} style={{ textDecoration: 'none', display: 'block' }}>
                        <div style={{
                          padding: '12px 18px', borderBottom: '1px solid var(--border-light)',
                          display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer',
                          background: n.type === 'warning' ? 'var(--stat-red)' : 'transparent',
                          transition: 'background 0.15s',
                        }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--table-hover)'}
                          onMouseLeave={e => e.currentTarget.style.background = n.type === 'warning' ? 'var(--stat-red)' : 'transparent'}
                        >
                          <span style={{ fontSize: 18, flexShrink: 0 }}>{n.icon}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>{n.text}</div>
                            {n.sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{n.sub}</div>}
                          </div>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0, whiteSpace: 'nowrap' }}>{n.time}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <Link to="/tasks" onClick={() => setShowNotif(false)} style={{
                    display: 'block', textAlign: 'center', padding: '10px', fontSize: 13,
                    color: 'var(--accent)', fontWeight: 600, borderTop: '1px solid var(--border-light)',
                    textDecoration: 'none',
                  }}>
                    View all tasks →
                  </Link>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div ref={menuRef} style={{ position: 'relative' }}>
              <div className="avatar" onClick={() => setShowMenu(!showMenu)}
                style={{ background: user?.avatarColor || '#14b8a6', cursor: 'pointer', width: 38, height: 38 }}>
                {initials}
              </div>
              {showMenu && (
                <div style={{
                  position: 'absolute', top: 46, right: 0, background: 'var(--dropdown-bg)',
                  border: '1px solid var(--border)', borderRadius: 12, padding: 8,
                  boxShadow: '0 8px 30px rgba(0,0,0,0.12)', minWidth: 160, zIndex: 200,
                }}>
                  <div style={{ padding: '8px 12px', fontSize: 13, fontWeight: 600 }}>{user?.name}</div>
                  <div style={{ padding: '4px 12px', fontSize: 12, color: 'var(--text-muted)' }}>{user?.email}</div>
                  <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />
                  <button onClick={() => { navigate('/profile'); setShowMenu(false); }}
                    style={{ width: '100%', padding: '8px 12px', background: 'none', border: 'none', textAlign: 'left', fontSize: 13, cursor: 'pointer', borderRadius: 8, color: 'var(--text-primary)' }}>
                    👤 Profile
                  </button>
                  {user?.role === 'ADMIN' && (
                    <button onClick={() => { navigate('/team'); setShowMenu(false); }}
                      style={{ width: '100%', padding: '8px 12px', background: 'none', border: 'none', textAlign: 'left', fontSize: 13, cursor: 'pointer', borderRadius: 8, color: 'var(--text-primary)' }}>
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

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
