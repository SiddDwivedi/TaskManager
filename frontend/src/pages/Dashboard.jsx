import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout title="Dashboard"><div className="loading-page"><div className="spinner" /></div></Layout>;

  const { stats, upcomingTasks, recentTasks, myProjects } = data;

  return (
    <Layout title="Dashboard">
      {/* Stat Cards */}
      <div className="stat-cards">
        <div className="stat-card green">
          <div className="stat-label">Total Tasks</div>
          <div className="stat-value">{stats.totalTasks}</div>
          <div className="stat-sub">Visible work items</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-label">Completed</div>
          <div className="stat-value">{stats.doneTasks}</div>
          <div className="stat-sub">Finished tasks</div>
        </div>
        <div className="stat-card yellow">
          <div className="stat-label">In Progress</div>
          <div className="stat-value">{stats.inProgressTasks}</div>
          <div className="stat-sub">Active tasks</div>
        </div>
        <div className="stat-card red">
          <div className="stat-label">Overdue</div>
          <div className="stat-value">{stats.overdueTasks}</div>
          <div className="stat-sub">Need attention</div>
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="card" style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div className="section-label">Recent Tasks</div>
            <div className="section-title">Latest activity</div>
          </div>
          <Link to="/projects/new" className="btn btn-primary">+ New Project</Link>
        </div>

        {recentTasks.length === 0 && (
          <div className="empty-state" style={{ padding: 30 }}>
            <div className="empty-icon">📋</div>
            <h3>No tasks yet</h3>
            <p>Create a project and add your first task</p>
          </div>
        )}

        {recentTasks.map(t => (
          <Link to={`/tasks/${t.id}`} key={t.id} style={{ textDecoration: 'none', display: 'block' }}>
            <div className="task-card">
              <div className="task-card-title">{t.title}</div>
              {t.description && <div className="task-card-desc">{t.description.slice(0, 100)}</div>}
              <div className="task-meta-grid">
                <div className="task-meta-item">
                  <div className="task-meta-label">Project</div>
                  <div className="task-meta-value">{t.project?.name}</div>
                </div>
                <div className="task-meta-item">
                  <div className="task-meta-label">Assignee</div>
                  <div className="task-meta-value">{t.assignee?.name || 'Unassigned'}</div>
                </div>
                <div className="task-meta-item">
                  <div className="task-meta-label">Status</div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    <span className={`badge badge-${t.status.toLowerCase()}`}>{t.status.replace('_', ' ')}</span>
                    {t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE' && (
                      <span className="badge badge-overdue">Overdue</span>
                    )}
                  </div>
                </div>
                <div className="task-meta-item">
                  <div className="task-meta-label">Priority</div>
                  <span className={`badge badge-${t.priority.toLowerCase()}`}>{t.priority}</span>
                </div>
              </div>
              <div className="progress-wrap">
                <div className="progress-bar" style={{ flex: 1 }}>
                  <div className="progress-fill" style={{ width: t.status === 'DONE' ? '100%' : t.status === 'IN_PROGRESS' ? '50%' : t.status === 'OVERDUE' ? '80%' : '10%' }} />
                </div>
                <span className="progress-text">
                  {t.status === 'DONE' ? '100%' : t.status === 'IN_PROGRESS' ? '50%' : t.status === 'OVERDUE' ? '80%' : '10%'}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* My Projects */}
      {myProjects.length > 0 && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <div className="section-label">Projects</div>
            <div className="section-title">Your workspaces</div>
          </div>
          <div className="grid-3">
            {myProjects.slice(0, 6).map(p => (
              <Link to={`/projects/${p.id}`} key={p.id} style={{ textDecoration: 'none' }}>
                <div className="project-card clickable" style={{ height: '100%' }}>
                  <div className="project-card-label">PROJECT</div>
                  <div className="project-card-name">{p.name}</div>
                  <div className="project-stats">
                    <div>
                      <div className="project-stat-label">Team</div>
                      <div className="project-stat-value">{p._count.members}</div>
                    </div>
                    <div>
                      <div className="project-stat-label">Tasks</div>
                      <div className="project-stat-value">{p._count.tasks}</div>
                    </div>
                    <div>
                      <div className="project-stat-label">Done</div>
                      <div className="project-stat-value">{stats.completionRate}%</div>
                    </div>
                  </div>
                  <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Open project</button>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
}
