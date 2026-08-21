import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { logout } from '../../api';

export const AccountLayout = () => {
  const { user, logoutLocal } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // ignore
    }
    logoutLocal();
    navigate('/');
  };

  const tabs = [
    ['/account', 'Profile', true],
    ['/account/orders', 'My orders', false],
    ['/account/addresses', 'Addresses', false],
    ['/account/password', 'Change password', false],
  ] as const;

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 30, fontWeight: 800 }}>My account</h1>
        <button className="btn btn-outline btn-sm" onClick={handleLogout}>Log out</button>
      </div>

      <div className="aside-left">
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {tabs.map(([to, label, end]) => (
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
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--c-text-muted)', padding: '14px 12px 4px' }}>
            Role: {user?.role}
          </div>
        </nav>

        <div>
          <Outlet />
        </div>
      </div>
    </div>
  );
};