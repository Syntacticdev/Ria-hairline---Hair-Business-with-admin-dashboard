import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, getErrorMessage } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const isStaff = (role?: string) => role === 'admin' || role === 'manager';

export const Login = () => {
  const { setUser, setToken } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await login({ email, password });
      if (!isStaff(data.user.role)) {
        setError('This account does not have staff access.');
        return;
      }
      setToken(data.token);
      setUser(data.user);
      showToast('Welcome back!');
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}>
      <div className="card" style={{ width: '100%', maxWidth: 400, padding: 32 }}>
        <div style={{ fontWeight: 800, fontSize: 18, textAlign: 'center', letterSpacing: '-0.02em' }}>
          RIA HAIRLINE
          <div style={{ fontWeight: 400, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--c-text-muted)', marginTop: 2 }}>
            Admin dashboard
          </div>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, textAlign: 'center', margin: '24px 0 4px' }}>Staff sign in</h1>
        <p className="text-muted" style={{ textAlign: 'center', fontSize: 13, marginBottom: 24 }}>
          Only admin and manager accounts can access this dashboard.
        </p>

        {error && <div className="error-text" style={{ marginBottom: 14 }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
          <div>
            <label htmlFor="email">Email</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label htmlFor="password">Password</label>
            <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button className="btn btn-block" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
};