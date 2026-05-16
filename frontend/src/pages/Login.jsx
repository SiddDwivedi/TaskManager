import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  const demoLogin = async (email, password) => {
    setForm({ email, password });
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <h1>Team Task Manager</h1>
        <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 16, color: 'var(--text-primary)' }}>
          Sign in to manage projects, tasks, and progress in one calm workspace.
        </h1>
        <p>Sign in to manage projects, assign work, track overdue items, and keep the team aligned from one place.</p>
      </div>
      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-card-label">WELCOME BACK</div>
          <h2>Log in</h2>
          <p className="subtitle">Pick up where your team left off.</p>
          <form className="auth-form" onSubmit={submit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" name="email" value={form.email} onChange={handle} placeholder="you@example.com" required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" name="password" value={form.password} onChange={handle} placeholder="••••••••" required />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? <span className="spinner" style={{width:18,height:18}} /> : 'Sign in'}
            </button>
          </form>
          <div className="demo-section">
            <h4>Demo Accounts</h4>
            <p>Click any demo account below to log in instantly.</p>
            <div className="demo-btns">
              <button className="demo-btn" onClick={() => demoLogin('admin@taskmanager.com', 'admin123')}>
                <strong>Admin Demo</strong>
                <span>admin@taskmanager.com</span>
              </button>
              <button className="demo-btn" onClick={() => demoLogin('alice@taskmanager.com', 'member123')}>
                <strong>Member Demo</strong>
                <span>alice@taskmanager.com</span>
              </button>
            </div>
          </div>
          <div className="auth-switch">
            Don't have an account? <Link to="/signup">Sign up</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
