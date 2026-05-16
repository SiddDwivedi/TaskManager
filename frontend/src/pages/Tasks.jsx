import  { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import Layout from '../components/Layout';

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', priority: '', search: '' });
  const [projects, setProjects] = useState([]);
  const [projectFilter, setProjectFilter] = useState('');

  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.priority) params.set('priority', filters.priority);
    if (projectFilter) params.set('projectId', projectFilter);
    if (filters.search) params.set('search', filters.search);
    api.get(`/tasks?${params}`).then(r => setTasks(r.data.tasks)).finally(() => setLoading(false));
  }, [filters, projectFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.get('/projects').then(r => setProjects(r.data.projects)); }, []);

  const setFilter = (k, v) => setFilters(f => ({ ...f, [k]: v }));

  const updateStatus = async (taskId, status, e) => {
    e.preventDefault(); e.stopPropagation();
    await api.put(`/tasks/${taskId}`, { status }); load();
  };

  return (
    <Layout title="Tasks">
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>All Tasks</h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>View and manage all tasks across your projects.</p>
      </div>

      <div className="filter-bar">
        <input className="form-input" placeholder="🔍 Search tasks..." value={filters.search} onChange={e => setFilter('search', e.target.value)} style={{ maxWidth: 220, borderRadius: 999 }} />
        <select className="form-input" value={filters.status} onChange={e => setFilter('status', e.target.value)} style={{ borderRadius: 999 }}>
          <option value="">All Statuses</option>
          <option value="TODO">To Do</option><option value="IN_PROGRESS">In Progress</option><option value="DONE">Done</option><option value="OVERDUE">Overdue</option>
        </select>
        <select className="form-input" value={filters.priority} onChange={e => setFilter('priority', e.target.value)} style={{ borderRadius: 999 }}>
          <option value="">All Priorities</option>
          <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="CRITICAL">Critical</option>
        </select>
        <select className="form-input" value={projectFilter} onChange={e => setProjectFilter(e.target.value)} style={{ borderRadius: 999 }}>
          <option value="">All Projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {loading && <div className="loading-page"><div className="spinner" /></div>}
      {!loading && tasks.length === 0 && (
        <div className="empty-state"><div className="empty-icon">✅</div><h3>No tasks found</h3><p>Try adjusting filters or create tasks from a project</p></div>
      )}

      {tasks.map(t => (
        <Link to={`/tasks/${t.id}`} key={t.id} style={{ textDecoration: 'none', display: 'block' }}>
          <div className="task-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div className="task-card-title">{t.title}</div>
                {t.description && <div className="task-card-desc">{t.description.slice(0, 80)}</div>}
              </div>
              <select className="form-input" style={{ width: 'auto', fontSize: 12, padding: '4px 10px', borderRadius: 999 }}
                value={t.status} onClick={e => e.preventDefault()} onChange={e => updateStatus(t.id, e.target.value, e)}>
                {['TODO','IN_PROGRESS','DONE','OVERDUE'].map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
              </select>
            </div>
            <div className="task-meta-grid">
              <div className="task-meta-item"><div className="task-meta-label">Project</div><div className="task-meta-value">{t.project?.name}</div></div>
              <div className="task-meta-item"><div className="task-meta-label">Assignee</div><div className="task-meta-value">{t.assignee?.name || 'Unassigned'}</div></div>
              <div className="task-meta-item"><div className="task-meta-label">Status</div><span className={`badge badge-${t.status.toLowerCase()}`}>{t.status.replace('_',' ')}</span></div>
              <div className="task-meta-item"><div className="task-meta-label">Priority</div><span className={`badge badge-${t.priority.toLowerCase()}`}>{t.priority}</span></div>
            </div>
            <div className="progress-wrap">
              <div className="progress-bar" style={{ flex: 1 }}>
                <div className="progress-fill" style={{ width: t.status === 'DONE' ? '100%' : t.status === 'IN_PROGRESS' ? '50%' : '10%' }} />
              </div>
              <span className="progress-text">{t.status === 'DONE' ? '100%' : t.status === 'IN_PROGRESS' ? '50%' : '10%'}</span>
            </div>
          </div>
        </Link>
      ))}
    </Layout>
  );
}
