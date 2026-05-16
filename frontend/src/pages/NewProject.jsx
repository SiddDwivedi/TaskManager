import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';

export default function NewProject() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', description: '', deadline: '' });
  const [loading, setLoading] = useState(false);
  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const submit = async e => {
    e.preventDefault(); setLoading(true);
    try { const r = await api.post('/projects', form); toast.success('Created!'); navigate(`/projects/${r.data.project.id}`); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); } finally { setLoading(false); }
  };
  return (
    <Layout title="Projects">
      <div style={{ maxWidth: 600 }}>
        <div className="card">
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>New Project</h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>Set up your project workspace and start managing tasks.</p>
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="form-group"><label className="form-label">Project Name *</label><input className="form-input" name="name" value={form.name} onChange={handle} placeholder="e.g. Website Redesign" required /></div>
            <div className="form-group"><label className="form-label">Description</label><textarea className="form-input" name="description" value={form.description} onChange={handle} placeholder="What is this project about?" rows={4} /></div>
            <div className="form-group"><label className="form-label">Deadline</label><input className="form-input" type="date" name="deadline" value={form.deadline} onChange={handle} /></div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Project'}</button>
              <button className="btn btn-secondary" type="button" onClick={() => navigate('/projects')}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
