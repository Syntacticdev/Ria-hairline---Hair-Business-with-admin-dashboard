import { useEffect, useState, useCallback } from 'react';
import { getAllUsers, updateUser } from '../api';
import type { Role, User } from '../types';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../api';

const ROLES: Role[] = ['user', 'manager', 'admin'];

export const Users = () => {
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const load = useCallback(() => {
    setLoading(true);
    getAllUsers({ page, search })
      .then((data) => {
        setUsers(data.users);
        setPages(data.pagination.pages);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => {
    load();
  }, [load]);

  const changeRole = async (user: User, role: Role) => {
    try {
      await updateUser(user.id, { role });
      showToast(`${user.firstName} is now ${role}`);
      load();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const toggleActive = async (user: User) => {
    try {
      await updateUser(user.id, { isActive: !user.isActive });
      showToast(user.isActive ? 'Account deactivated' : 'Account activated');
      load();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 20 }}>Users</h1>

      <input
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        placeholder="Search by name or email…"
        style={{ maxWidth: 320, marginBottom: 18 }}
      />

      <div className="card" style={{ overflowX: 'auto' }}>
        {loading ? (
          <p className="text-muted" style={{ padding: 20 }}>Loading…</p>
        ) : users.length === 0 ? (
          <p className="text-muted" style={{ padding: 20 }}>No users found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Orders count</th>
                <th>Status</th>
                <th>Joined</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>{u.firstName} {u.lastName}</td>
                  <td>{u.email}</td>
                  <td>
                    <select value={u.role} onChange={(e) => changeRole(u, e.target.value as Role)} style={{ width: 110, padding: '6px 8px' }}>
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </td>
                  <td className="text-muted">—</td>
                  <td>
                    <span className="badge" style={{ borderColor: u.isActive ? '#14532d' : '#991515', color: u.isActive ? '#14532d' : '#991515' }}>
                      {u.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="text-muted">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                  <td>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button className="btn btn-outline btn-sm" onClick={() => toggleActive(u)}>
                        {u.isActive ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {pages > 1 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 20 }}>
          <button className="btn btn-outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
          <span className="text-muted" style={{ alignSelf: 'center', fontSize: 14 }}>Page {page} of {pages}</span>
          <button className="btn btn-outline" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}
    </div>
  );
};