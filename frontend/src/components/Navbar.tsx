import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { logout } from '../api';

export const Navbar = () => {
  const { user, logoutLocal } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const isAdmin = user?.role === 'admin' || user?.role === 'manager';

  const close = () => setOpen(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // ignore network errors
    }
    logoutLocal();
    close();
    navigate('/');
  };

  const goAccount = () => {
    close();
    navigate(user ? '/account' : '/login');
  };

  return (
    <header style={{ borderBottom: '1px solid var(--c-border)', position: 'sticky', top: 0, background: '#fff', zIndex: 50 }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64, gap: 12 }}>
        <Link to="/" onClick={close} style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.03em', whiteSpace: 'nowrap' }}>
          RIA <span style={{ fontWeight: 500 }}>HAIRLINE</span>
        </Link>

        <nav className="nav-desktop">
          <Link to="/shop">Shop</Link>
          <Link to="/cart" style={{ position: 'relative' }}>
            Cart
            {count > 0 && <span className="nav-count">{count}</span>}
          </Link>
          {user ? (
            <>
              {isAdmin && <Link to="/account/orders">My Orders</Link>}
              <Link to="/account">Account</Link>
              {isAdmin && (
                <a href={import.meta.env.VITE_ADMIN_URL ?? 'http://localhost:5174'}>Admin</a>
              )}
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Log in</Link>
              <Link to="/register" className="btn btn-sm">
                Sign up
              </Link>
            </>
          )}
        </nav>

        <div className="nav-mobile-actions">
          <button className="nav-icon" aria-label="Account" onClick={goAccount}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-3.3 3.6-5 8-5s8 1.7 8 5" />
            </svg>
          </button>
          <Link to="/cart" className="nav-icon" aria-label="Cart" onClick={close} style={{ position: 'relative' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {count > 0 && <span className="nav-count">{count}</span>}
          </Link>
          <button className="nav-icon" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen((o) => !o)}>
            {open ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M5 5l14 14M19 5L5 19" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {open && (
        <div className="mobile-menu">
          <Link to="/shop" onClick={close}>Shop</Link>
          {user ? (
            <>
              <Link to="/account" onClick={close}>Account</Link>
              {isAdmin && <Link to="/account/orders" onClick={close}>My Orders</Link>}
              {isAdmin && (
                <a href={import.meta.env.VITE_ADMIN_URL ?? 'http://localhost:5174'} onClick={close}>Admin</a>
              )}
              <button className="btn btn-outline" style={{ marginTop: 8 }} onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={close}>Log in</Link>
              <Link to="/register" className="btn" style={{ marginTop: 8 }} onClick={close}>
                Sign up
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
};