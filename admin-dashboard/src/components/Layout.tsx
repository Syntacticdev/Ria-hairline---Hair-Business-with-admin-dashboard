import { Navigate, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logout } from '../api';

const isStaff = (role?: string) => role === 'admin' || role === 'manager';

export const Protected = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  // Only admin and manager roles are allowed into the dashboard.
  if (!isStaff(user.role)) return <Navigate to="/login" replace />;
  return <Outlet />;
};

const navItems = [
  ['/admin', 'Dashboard', true],
  ['/admin/products', 'Products', false],
  ['/admin/orders', 'Orders', false],
  ['/admin/transactions', 'Transactions', false],
  ['/admin/users', 'Users', false],
  ['/admin/reviews', 'Reviews', false],
] as const;

export const AdminLayout = () => {
  const { user, logoutLocal } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // ignore
    }
    logoutLocal();
  };

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div style={{ padding: '20px 18px', fontWeight: 800, fontSize: 15, letterSpacing: '-0.02em', borderBottom: '1px solid var(--c-border)' }}>
          RIA HAIRLINE
          <div style={{ fontWeight: 400, fontSize: 11, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>
            Admin dashboard
          </div>
        </div>
        <nav className="admin-nav">
          {navItems.map(([to, label, end]) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              style={({ isActive }) => ({
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 14,
                fontWeight: isActive ? 700 : 500,
                background: isActive ? '#0a0a0a' : 'transparent',
                color: isActive ? '#fff' : 'inherit',
              })}
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="admin-user" style={{ marginTop: 'auto', padding: 14, borderTop: '1px solid var(--c-border)', fontSize: 13 }}>
          <div style={{ fontWeight: 700 }}>{user?.firstName} {user?.lastName}</div>
          <div className="text-muted" style={{ textTransform: 'capitalize', fontSize: 12 }}>{user?.role}</div>
          <button className="btn btn-outline btn-sm" style={{ width: '100%', marginTop: 10 }} onClick={handleLogout}>
            Log out
          </button>
        </div>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
};