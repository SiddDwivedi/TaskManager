import  { useEffect, useState } from 'react';
import api from '../api/client';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';

export default function Team() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = () => { api.get('/users').then(r => setUsers(r.data.users)).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);
  const changeRole = async (userId, role) => { try { await api.put(`/users/${userId}`, { role }); toast.success('Updated!'); load(); } catch { toast.error('Failed'); } };
  const deleteUser = async (userId) => { if (!window.confirm('Delete user?')) return; try { await api.delete(`/users/${userId}`); toast.success('Deleted'); load(); } catch { toast.error('Failed'); } };

  return (
    <Layout title="Team">
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Team Management</h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Manage workspace members, update roles, and remove users.</p>
      </div>
      {loading ? <div className="loading-page"><div className="spinner" /></div> : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Member</th><th>Email</th><th>Role</th><th>Tasks</th><th>Joined</th><th>Actions</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div className="avatar avatar-sm" style={{ background: u.avatarColor }}>{u.name[0].toUpperCase()}</div><span style={{ fontWeight: 600 }}>{u.name}</span></div></td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{u.email}</td>
                    <td><select className="form-input" style={{ width: 'auto', padding: '4px 10px', fontSize: 12, borderRadius: 999 }} value={u.role} onChange={e => changeRole(u.id, e.target.value)}><option value="ADMIN">ADMIN</option><option value="MEMBER">MEMBER</option></select></td>
                    <td style={{ fontSize: 13 }}>{u._count.assignedTasks}</td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td><button className="btn btn-danger btn-sm" onClick={() => deleteUser(u.id)}>Remove</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
}
