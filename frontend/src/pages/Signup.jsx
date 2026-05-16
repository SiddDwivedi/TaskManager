import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'MEMBER' });
  const [loading, setLoading] = useState(false);
  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const submit = async e => {
    e.preventDefault(); setLoading(true);
    try { await signup(form.name, form.email, form.password, form.role); toast.success('Account created!'); navigate('/dashboard'); }
    catch (err) { toast.error(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Signup failed'); }
    finally { setLoading(false); }
  };
  return (
    <div className="auth-page">
      <div className="auth-left">
        <h1>Team Task Manager</h1>
        <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 16 }}>Create your account and start managing tasks today.</h1>
        <p>Join your team, create projects, assign work, and track progress from one workspace.</p>
      </div>
      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-card-label">GET STARTED</div>
          <h2>Sign up</h2>
          <p className="subtitle">Create your workspace account.</p>
          <form className="auth-form" onSubmit={submit}>
            <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" name="name" value={form.name} onChange={handle} required minLength={2} /></div>
            <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" name="email" value={form.email} onChange={handle} required /></div>
            <div className="form-group"><label className="form-label">Password</label><input className="form-input" type="password" name="password" value={form.password} onChange={handle} required minLength={6} /></div>
            <div className="form-group"><label className="form-label">Role</label>
              <select className="form-input" name="role" value={form.role} onChange={handle}><option value="MEMBER">Member</option><option value="ADMIN">Admin</option></select></div>
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? <span className="spinner" style={{width:18,height:18}} /> : 'Create Account'}
            </button>
          </form>
          <div className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></div>
        </div>
      </div>
    </div>
  );
}
