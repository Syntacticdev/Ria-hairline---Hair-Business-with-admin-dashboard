import { useEffect, useState } from 'react';
import { updateProfile } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../api/client';

export const Profile = () => {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [profile, setProfile] = useState({ firstName: '', lastName: '', phone: '', avatar: user?.avatar ?? undefined });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) setProfile({ firstName: user.firstName, lastName: user.lastName, phone: user.phone ?? '', avatar: user.avatar });
  }, [user]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(profile);
      await refreshUser();
      showToast('Profile updated');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="card" style={{ padding: 24 }}>
      <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 18 }}>Profile</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          className={`avatar-btn ${profile.avatar === 'male' ? 'selected' : ''}`}
          onClick={() => setProfile((p) => ({ ...p, avatar: 'male' }))}
          disabled={saving}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="5" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
            <line x1="9" y1="15" x2="9.01" y2="15" />
            <line x1="15" y1="15" x2="15.01" y2="15" />
          </svg>
        </button>
        <button
          className={`avatar-btn ${profile.avatar === 'female' ? 'selected' : ''}`}
          onClick={() => setProfile((p) => ({ ...p, avatar: 'female' }))}
          disabled={saving}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="5" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
            <line x1="9" y1="15" x2="9.01" y2="15" />
            <line x1="15" y1="15" x2="15.01" y2="15" />
          </svg>
        </button>
        <button
          className={`avatar-btn ${profile.avatar === 'young' ? 'selected' : ''}`}
          onClick={() => setProfile((p) => ({ ...p, avatar: 'young' }))}
          disabled={saving}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="5" />
            <path d="M12 2v2" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="M12 20v2" />
            <line x1="2" y1="2" x2="22" y2="22" />
          </svg>
        </button>
        <button
          className={`avatar-btn ${profile.avatar === 'baddie' ? 'selected' : ''}`}
          onClick={() => setProfile((p) => ({ ...p, avatar: 'baddie' }))}
          disabled={saving}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="5" />
            <path d="M12 2v2" />
            <path d="M2 12h2" />
            <path d="M22 12h2" />
            <path d="M12 20v2" />
            <line x1="2" y1="2" x2="22" y2="22" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
      </div>
      <form onSubmit={save} className="form-2" style={{ maxWidth: 480 }}>
        <div>
          <label>First name</label>
          <input value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} />
        </div>
        <div>
          <label>Last name</label>
          <input value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} />
        </div>
        <div>
          <label>Email</label>
          <input value={user?.email ?? ''} disabled />
        </div>
        <div>
          <label>Phone</label>
          <input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="+234…" />
        </div>
        <div>
          <button className="btn" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
        </div>
      </form>
    </section>
  );
};