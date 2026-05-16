import  { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function TaskDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [comment, setComment] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [projectMembers, setProjectMembers] = useState([]);

  const load = useCallback(() => {
    api.get(`/tasks/${id}`).then(r => {
      setTask(r.data.task);
      setEditForm({ title: r.data.task.title, description: r.data.task.description || '', status: r.data.task.status, priority: r.data.task.priority, assigneeId: r.data.task.assigneeId || '', dueDate: r.data.task.dueDate ? new Date(r.data.task.dueDate).toISOString().split('T')[0] : '' });
      api.get(`/projects/${r.data.task.projectId}`).then(pr => setProjectMembers(pr.data.project.members));
    }).catch(() => navigate('/tasks')).finally(() => setLoading(false));
  }, [id, navigate]);
  useEffect(() => { load(); }, [load]);

  const saveEdit = async () => {
    try { await api.put(`/tasks/${id}`, { ...editForm, assigneeId: editForm.assigneeId || null }); toast.success('Updated!'); setEditing(false); load(); }
    catch { toast.error('Failed'); }
  };
  const deleteTask = async () => { if (!window.confirm('Delete?')) return; await api.delete(`/tasks/${id}`); toast.success('Deleted'); navigate(-1); };
  const addComment = async e => {
    e.preventDefault(); if (!comment.trim()) return; setCommenting(true);
    try { await api.post(`/tasks/${id}/comments`, { content: comment }); setComment(''); load(); }
    catch { toast.error('Failed'); } finally { setCommenting(false); }
  };

  if (loading) return <Layout title="Tasks"><div className="loading-page"><div className="spinner" /></div></Layout>;
  if (!task) return null;
  const canEdit = user?.role === 'ADMIN' || task.creatorId === user?.id || task.assigneeId === user?.id;

  return (
    <Layout title="Tasks">
      <div style={{ maxWidth: 800 }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
          <Link to="/tasks" style={{ color: 'var(--accent)' }}>Tasks</Link> /
          <Link to={`/projects/${task.projectId}`} style={{ color: 'var(--accent)', marginLeft: 4 }}>{task.project?.name}</Link> /
          <span style={{ marginLeft: 4 }}>{task.title}</span>
        </div>

        <div className="card" style={{ marginBottom: 20 }}>
          {editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group"><label className="form-label">Title</label><input className="form-input" value={editForm.title} onChange={e => setEditForm(f => ({...f, title: e.target.value}))} /></div>
              <div className="form-group"><label className="form-label">Description</label><textarea className="form-input" value={editForm.description} onChange={e => setEditForm(f => ({...f, description: e.target.value}))} rows={4} /></div>
              <div className="grid-2">
                <div className="form-group"><label className="form-label">Status</label><select className="form-input" value={editForm.status} onChange={e => setEditForm(f => ({...f, status: e.target.value}))}>{['TODO','IN_PROGRESS','DONE','OVERDUE'].map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}</select></div>
                <div className="form-group"><label className="form-label">Priority</label><select className="form-input" value={editForm.priority} onChange={e => setEditForm(f => ({...f, priority: e.target.value}))}>{['LOW','MEDIUM','HIGH','CRITICAL'].map(p => <option key={p} value={p}>{p}</option>)}</select></div>
              </div>
              <div className="grid-2">
                <div className="form-group"><label className="form-label">Assignee</label><select className="form-input" value={editForm.assigneeId} onChange={e => setEditForm(f => ({...f, assigneeId: e.target.value}))}><option value="">Unassigned</option>{projectMembers.map(m => <option key={m.user.id} value={m.user.id}>{m.user.name}</option>)}</select></div>
                <div className="form-group"><label className="form-label">Due Date</label><input className="form-input" type="date" value={editForm.dueDate} onChange={e => setEditForm(f => ({...f, dueDate: e.target.value}))} /></div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}><button className="btn btn-primary" onClick={saveEdit}>Save</button><button className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button></div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
                <h2 style={{ fontSize: 22, fontWeight: 800 }}>{task.title}</h2>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  {canEdit && <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>Edit</button>}
                  {canEdit && <button className="btn btn-danger btn-sm" onClick={deleteTask}>Delete</button>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                <span className={`badge badge-${task.status.toLowerCase()}`}>{task.status.replace('_',' ')}</span>
                <span className={`badge badge-${task.priority.toLowerCase()}`}>{task.priority}</span>
              </div>
              {task.description && <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, marginBottom: 16 }}>{task.description}</p>}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, background: 'var(--bg-primary)', borderRadius: 12, padding: 16 }}>
                <div><div className="task-meta-label">Assignee</div>{task.assignee ? <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div className="avatar avatar-sm" style={{ background: task.assignee.avatarColor }}>{task.assignee.name[0].toUpperCase()}</div><span style={{ fontSize: 13, fontWeight: 600 }}>{task.assignee.name}</span></div> : <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Unassigned</span>}</div>
                <div><div className="task-meta-label">Due Date</div><div style={{ fontSize: 13, fontWeight: 600 }}>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}</div></div>
                <div><div className="task-meta-label">Created by</div><div style={{ fontSize: 13, fontWeight: 600 }}>{task.creator?.name}</div></div>
              </div>
            </>
          )}
        </div>

        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 20 }}>Comments ({task.comments.length})</h3>
          {task.comments.map(c => (
            <div className="comment" key={c.id}>
              <div className="avatar avatar-sm" style={{ background: c.user.avatarColor }}>{c.user.name[0].toUpperCase()}</div>
              <div className="comment-content">
                <div><span className="comment-author">{c.user.name}</span><span className="comment-time">{timeAgo(c.createdAt)}</span></div>
                <div className="comment-text">{c.content}</div>
              </div>
            </div>
          ))}
          {task.comments.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No comments yet.</p>}
          <form onSubmit={addComment} style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <input className="form-input" value={comment} onChange={e => setComment(e.target.value)} placeholder="Write a comment..." style={{ flex: 1 }} />
            <button className="btn btn-primary btn-sm" type="submit" disabled={commenting || !comment.trim()}>Post</button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
