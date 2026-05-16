import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import Layout from '../components/Layout';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/projects').then(r => setProjects(r.data.projects)).finally(() => setLoading(false));
  }, []);

  return (
    <Layout title="Projects">
      {/* Header */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800 }}>Project workspace</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
              Build new projects, assign members by email, and open each workspace for deeper task management.
            </p>
          </div>
          <Link to="/projects/new" className="btn btn-primary">New project</Link>
        </div>
      </div>

      {loading && <div className="loading-page"><div className="spinner" /></div>}

      {!loading && projects.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📁</div>
          <h3>No projects yet</h3>
          <p>Create your first project to get started</p>
          <Link to="/projects/new" className="btn btn-primary" style={{ marginTop: 16 }}>New project</Link>
        </div>
      )}

      <div className="grid-2">
        {projects.map(p => {
          const totalTasks = p._count?.tasks || 0;
          return (
            <div className="project-card" key={p.id}>
              <div className="project-card-header">
                <div className="project-card-label">PROJECT</div>
                <Link to={`/projects/${p.id}`} className="btn btn-secondary btn-sm">Edit</Link>
              </div>
              <div className="project-card-name">{p.name}</div>
              {p.description && <div className="project-card-desc">{p.description}</div>}
              <div className="project-stats">
                <div>
                  <div className="project-stat-label">Team</div>
                  <div className="project-stat-value">{p.members.length}</div>
                </div>
                <div>
                  <div className="project-stat-label">Due</div>
                  <div className="project-stat-value">{p.deadline ? new Date(p.deadline).toLocaleDateString() : '—'}</div>
                </div>
                <div>
                  <div className="project-stat-label">Done</div>
                  <div className="project-stat-value">0%</div>
                </div>
              </div>
              <div className="project-footer">
                <span>0/{totalTasks} tasks</span>
                <span style={{ color: 'var(--overdue)' }}>0 overdue</span>
              </div>
              <div style={{ marginBottom: 10 }}>
                <div className="progress-bar"><div className="progress-fill" style={{ width: '0%', background: 'var(--accent)' }} /></div>
              </div>
              <Link to={`/projects/${p.id}`} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                Open project
              </Link>
            </div>
          );
        })}
      </div>
    </Layout>
  );
}
