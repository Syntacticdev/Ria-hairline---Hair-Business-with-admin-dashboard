import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login, googleLogin } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../api/client';
import { GoogleLoginButton } from '../components/GoogleLoginButton';

export const Login = () => {
  const { user, loading, setUser, setToken } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  if (!loading && user) {
    navigate('/', { replace: true });
    return null;
  }

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!loading && user) {
    navigate('/', { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const data = await login({ email, password });
      setToken(data.token);
      setUser(data.user);
      showToast(`Welcome back, ${data.user.firstName}!`);
      navigate('/');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async (idToken: string) => {
    setIsLoading(true);
    setError('');
    try {
      const data = await googleLogin(idToken);
      setToken(data.token);
      setUser(data.user);
      showToast(`Welcome, ${data.user.firstName}!`);
      navigate('/');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 420, padding: '60px 20px' }}>
      <div className="card" style={{ padding: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, textAlign: 'center' }}>Log in</h1>
        <p className="text-muted" style={{ textAlign: 'center', fontSize: 13, margin: '8px 0 24px' }}>
          Welcome back to Ria Hairline.
        </p>

        {error && <div className="error-text" style={{ marginBottom: 14 }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
          <div>
            <label htmlFor="email">Email</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div>
            <label htmlFor="password">Password</label>
            <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <button className="btn btn-block" disabled={isLoading}>
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
          <span style={{ flex: 1, height: 1, background: 'var(--c-border)' }} />
          <span className="text-muted" style={{ fontSize: 12 }}>or</span>
          <span style={{ flex: 1, height: 1, background: 'var(--c-border)' }} />
        </div>

        <GoogleLoginButton onSuccess={handleGoogle} />

        <p className="text-muted" style={{ textAlign: 'center', fontSize: 13, marginTop: 20 }}>
          No account yet? <Link to="/register" style={{ textDecoration: 'underline', fontWeight: 600 }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
};