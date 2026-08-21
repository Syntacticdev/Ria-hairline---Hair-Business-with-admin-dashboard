import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register, googleLogin } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../api/client';
import { GoogleLoginButton } from '../components/GoogleLoginButton';

export const Register = () => {
  const { user, loading, setUser, setToken } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  if (!loading && user) {
    navigate('/', { replace: true });
    return null;
  }

  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const data = await register(form);
      setToken(data.token);
      setUser(data.user);
      showToast('Account created. Welcome to Ria Hairline!');
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
        <h1 style={{ fontSize: 26, fontWeight: 800, textAlign: 'center' }}>Create your account</h1>
        <p className="text-muted" style={{ textAlign: 'center', fontSize: 13, margin: '8px 0 24px' }}>
          Register to order from Ria Hairline.
        </p>

        {error && <div className="error-text" style={{ marginBottom: 14 }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
          <div className="form-2">
            <div>
              <label htmlFor="firstName">First name</label>
              <input id="firstName" required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            </div>
            <div>
              <label htmlFor="lastName">Last name</label>
              <input id="lastName" required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            </div>
          </div>
          <div>
            <label htmlFor="email">Email</label>
            <input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
          </div>
          <div>
            <label htmlFor="password">Password</label>
            <input id="password" type="password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 8 characters" />
          </div>
          <button className="btn btn-block" disabled={isLoading}>
            {loading ? 'Creating account…' : 'Sign up'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
          <span style={{ flex: 1, height: 1, background: 'var(--c-border)' }} />
          <span className="text-muted" style={{ fontSize: 12 }}>or</span>
          <span style={{ flex: 1, height: 1, background: 'var(--c-border)' }} />
        </div>

        <GoogleLoginButton onSuccess={handleGoogle} />

        <p className="text-muted" style={{ textAlign: 'center', fontSize: 13, marginTop: 20 }}>
          Already have an account? <Link to="/login" style={{ textDecoration: 'underline', fontWeight: 600 }}>Log in</Link>
        </p>
      </div>
    </div>
  );
};