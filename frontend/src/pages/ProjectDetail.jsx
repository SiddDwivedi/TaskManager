import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const STATUS_OPTS = ['TODO', 'IN_PROGRESS', 'DONE', 'OVERDUE'];
const PRIORITY_OPTS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const load = useCallback(() => {
    api.get(`/projects/${id}`).then(r => setProject(r.data.project)).catch(() => navigate('/projects')).finally(() => setLoading(false));
  }, [id, navigate]);
  useEffect(() => { load(); }, [load]);

  const isAdmin = user?.role === 'ADMIN' || project?.members?.find(m => m.userId === user?.id && m.role === 'ADMIN');
  const totalTasks = project?.tasks?.length || 0;
  const doneTasks = project?.tasks?.filter(t => t.status === 'DONE').length || 0;
  const overdueTasks = project?.tasks?.filter(t => t.status === 'OVERDUE').length || 0;
  const openTasks = totalTasks - doneTasks;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const deleteProject = async () => {
    if (!window.confirm('Delete this project and all its tasks?')) return;
    await api.delete(`/projects/${id}`);
    toast.success('Deleted'); navigate('/projects');
  };
  const removeMember = async (userId) => {
    await api.delete(`/projects/${id}/members/${userId}`);
    toast.success('Removed'); load();
  };

  if (loading) return <Layout title="Projects"><div className="loading-page"><div className="spinner" /></div></Layout>;
  if (!project) return null;

  return (
    <Layout title="Projects">
      {/* Project Header */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800 }}>{project.name}</h2>
            {project.description && <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>{project.description}</p>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {isAdmin && <button className="btn btn-secondary" onClick={() => setShowEditModal(true)}>Edit project</button>}
            <button className="btn btn-primary" onClick={() => setShowTaskModal(true)}>New task</button>
            {isAdmin && <button className="btn btn-danger" onClick={deleteProject}>Delete project</button>}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="stat-cards">
        <div className="stat-card green">
          <div className="stat-label">Progress</div>
          <div className="stat-value">{progress}%</div>
          <div className="stat-sub">{doneTasks} of {totalTasks} tasks completed</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-label">Open tasks</div>
          <div className="stat-value">{openTasks}</div>
          <div className="stat-sub">Still in flight</div>
        </div>
        <div className="stat-card red">
          <div className="stat-label">Overdue</div>
          <div className="stat-value">{overdueTasks}</div>
          <div className="stat-sub">Past due and incomplete</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-label">Deadline</div>
          <div className="stat-value" style={{ fontSize: 24 }}>{project.deadline ? new Date(project.deadline).toLocaleDateString() : '—'}</div>
          <div className="stat-sub">Owner: {project.owner.name}</div>
        </div>
      </div>

      {/* Members */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div className="section-label">Team</div>
            <div className="section-title">Assigned members</div>
          </div>
          {isAdmin && <button className="btn btn-primary btn-sm" onClick={() => setShowMemberModal(true)}>+ Add member</button>}
        </div>
        <div className="grid-2">
          {project.members.map(m => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: 'var(--bg-primary)', borderRadius: 12, border: '1px solid var(--border-light)' }}>
              <div className="avatar" style={{ background: m.user.avatarColor }}>{m.user.name[0].toUpperCase()}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{m.user.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.user.email}</div>
                <span className={`badge badge-${m.role.toLowerCase()}`} style={{ marginTop: 4 }}>{m.role}</span>
              </div>
              {isAdmin && m.userId !== user?.id && (
                <button className="btn btn-danger btn-sm" onClick={() => removeMember(m.userId)}>Remove</button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tasks */}
      <div className="card">
        <div style={{ marginBottom: 16 }}>
          <div className="section-label">Tasks</div>
          <div className="section-title">All tasks ({totalTasks})</div>
        </div>
        {project.tasks.length === 0 && (
          <div className="empty-state" style={{ padding: 30 }}><div className="empty-icon">📋</div><h3>No tasks yet</h3></div>
        )}
        {project.tasks.map(t => (
          <Link to={`/tasks/${t.id}`} key={t.id} style={{ textDecoration: 'none', display: 'block' }}>
            <div className="task-card">
              <div className="task-card-title">{t.title}</div>
              {t.description && <div className="task-card-desc">{t.description.slice(0, 80)}</div>}
              <div className="task-meta-grid">
                <div className="task-meta-item">
                  <div className="task-meta-label">Assignee</div>
                  <div className="task-meta-value">{t.assignee?.name || 'Unassigned'}</div>
                </div>
                <div className="task-meta-item">
                  <div className="task-meta-label">Status</div>
                  <span className={`badge badge-${t.status.toLowerCase()}`}>{t.status.replace('_',' ')}</span>
                </div>
                <div className="task-meta-item">
                  <div className="task-meta-label">Priority</div>
                  <span className={`badge badge-${t.priority.toLowerCase()}`}>{t.priority}</span>
                </div>
                <div className="task-meta-item">
                  <div className="task-meta-label">Due</div>
                  <div className="task-meta-value">{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}</div>
                </div>
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
      </div>

      {showTaskModal && <TaskModal projectId={id} members={project.members} onClose={() => setShowTaskModal(false)} onCreated={load} />}
      {showMemberModal && <MemberModal projectId={id} onClose={() => setShowMemberModal(false)} onAdded={load} />}
      {showEditModal && <EditProjectModal project={project} onClose={() => setShowEditModal(false)} onUpdated={load} />}
    </Layout>
  );
}

function TaskModal({ projectId, members, onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', description: '', priority: 'MEDIUM', status: 'TODO', assigneeId: '', dueDate: '' });
  const [loading, setLoading] = useState(false);
  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const submit = async e => {
    e.preventDefault(); setLoading(true);
    try { await api.post('/tasks', { ...form, projectId, assigneeId: form.assigneeId || null }); toast.success('Created!'); onCreated(); onClose(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); } finally { setLoading(false); }
  };
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h3 className="modal-title">New Task</h3>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group"><label className="form-label">Title *</label><input className="form-input" name="title" value={form.title} onChange={handle} required /></div>
          <div className="form-group"><label className="form-label">Description</label><textarea className="form-input" name="description" value={form.description} onChange={handle} rows={3} /></div>
          <div className="grid-2">
            <div className="form-group"><label className="form-label">Priority</label>
              <select className="form-input" name="priority" value={form.priority} onChange={handle}>
                {PRIORITY_OPTS.map(p => <option key={p} value={p}>{p}</option>)}
              </select></div>
            <div className="form-group"><label className="form-label">Assign To</label>
              <select className="form-input" name="assigneeId" value={form.assigneeId} onChange={handle}>
                <option value="">Unassigned</option>
                {members.map(m => <option key={m.user.id} value={m.user.id}>{m.user.name}</option>)}
              </select></div>
          </div>
          <div className="form-group"><label className="form-label">Due Date</label><input className="form-input" type="date" name="dueDate" value={form.dueDate} onChange={handle} /></div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Task'}</button>
            <button className="btn btn-secondary" type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MemberModal({ projectId, onClose, onAdded }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const search = async (q) => { setQuery(q); if (q.length < 2) { setResults([]); return; } const r = await api.get(`/users/search?q=${q}`); setResults(r.data.users); };
  const add = async (userId, role = 'MEMBER') => {
    setLoading(true);
    try { await api.post(`/projects/${projectId}/members`, { userId, role }); toast.success('Added!'); onAdded(); onClose(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); } finally { setLoading(false); }
  };
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h3 className="modal-title">Add Member</h3>
        <div className="form-group" style={{ marginBottom: 16 }}>
          <label className="form-label">Search by name or email</label>
          <input className="form-input" value={query} onChange={e => search(e.target.value)} placeholder="Start typing..." />
        </div>
        {results.map(u => (
          <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
            <div className="avatar avatar-sm" style={{ background: u.avatarColor }}>{u.name[0].toUpperCase()}</div>
            <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.email}</div></div>
            <button className="btn btn-primary btn-sm" onClick={() => add(u.id)} disabled={loading}>Add</button>
          </div>
        ))}
        <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

function EditProjectModal({ project, onClose, onUpdated }) {
  const [form, setForm] = useState({ name: project.name, description: project.description || '', status: project.status, deadline: project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : '' });
  const [loading, setLoading] = useState(false);
  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const submit = async e => {
    e.preventDefault(); setLoading(true);
    try { await api.put(`/projects/${project.id}`, form); toast.success('Updated!'); onUpdated(); onClose(); }
    catch { toast.error('Failed'); } finally { setLoading(false); }
  };
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h3 className="modal-title">Edit Project</h3>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group"><label className="form-label">Name</label><input className="form-input" name="name" value={form.name} onChange={handle} required /></div>
          <div className="form-group"><label className="form-label">Description</label><textarea className="form-input" name="description" value={form.description} onChange={handle} rows={3} /></div>
          <div className="grid-2">
            <div className="form-group"><label className="form-label">Status</label>
              <select className="form-input" name="status" value={form.status} onChange={handle}>
                {['ACTIVE','COMPLETED','ON_HOLD','ARCHIVED'].map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
              </select></div>
            <div className="form-group"><label className="form-label">Deadline</label><input className="form-input" type="date" name="deadline" value={form.deadline} onChange={handle} /></div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
            <button className="btn btn-secondary" type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
