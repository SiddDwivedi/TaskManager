import { useState } from 'react';
import api from '../api/client';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const COLORS = ['#14b8a6','#7c3aed','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#3b82f6'];

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', avatarColor: user?.avatarColor || '#14b8a6' });
  const [pwForm, setPwForm] = useState({ password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  const saveProfile = async e => {
    e.preventDefault(); setLoading(true);
    try { const r = await api.put(`/users/${user.id}`, { name: form.name, avatarColor: form.avatarColor }); updateUser(r.data.user); toast.success('Saved!'); }
    catch { toast.error('Failed'); } finally { setLoading(false); }
  };
  const savePassword = async e => {
    e.preventDefault();
    if (pwForm.password !== pwForm.confirm) { toast.error('Passwords do not match'); return; }
    setPwLoading(true);
    try { await api.put(`/users/${user.id}`, { password: pwForm.password }); toast.success('Password updated!'); setPwForm({ password: '', confirm: '' }); }
    catch { toast.error('Failed'); } finally { setPwLoading(false); }
  };

  return (
    <Layout title="Profile">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 800 }}>
        <div className="card">
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div className="avatar avatar-lg" style={{ background: form.avatarColor, margin: '0 auto 12px', width: 72, height: 72, fontSize: 28 }}>{initials}</div>
            <h3 style={{ fontSize: 18, fontWeight: 700 }}>{user?.name}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{user?.email}</p>
            <span className={`badge badge-${user?.role?.toLowerCase()}`} style={{ marginTop: 8 }}>{user?.role}</span>
          </div>
          <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group"><label className="form-label">Display Name</label><input className="form-input" name="name" value={form.name} onChange={handle} required /></div>
            <div className="form-group"><label className="form-label">Avatar Color</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                {COLORS.map(c => (<button type="button" key={c} onClick={() => setForm(f => ({ ...f, avatarColor: c }))}
                  style={{ width: 32, height: 32, borderRadius: '50%', background: c, border: form.avatarColor === c ? '3px solid var(--text-primary)' : '3px solid transparent', cursor: 'pointer' }} />))}
              </div>
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
          </form>
        </div>
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 20 }}>Change Password</h3>
          <form onSubmit={savePassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group"><label className="form-label">New Password</label><input className="form-input" type="password" value={pwForm.password} onChange={e => setPwForm(f => ({...f, password: e.target.value}))} required minLength={6} /></div>
            <div className="form-group"><label className="form-label">Confirm Password</label><input className="form-input" type="password" value={pwForm.confirm} onChange={e => setPwForm(f => ({...f, confirm: e.target.value}))} required /></div>
            <button className="btn btn-primary" type="submit" disabled={pwLoading}>{pwLoading ? 'Updating...' : 'Update Password'}</button>
          </form>
          <div className="divider" />
          <div style={{ background: 'var(--bg-primary)', borderRadius: 12, padding: 16 }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Account Info</h4>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 2 }}>
              <div>📧 {user?.email}</div><div>🎭 Role: <strong>{user?.role}</strong></div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
