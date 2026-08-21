import { useState } from 'react';
import { changePassword } from '../../api';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../api/client';

export const Password = () => {
  const { showToast } = useToast();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '' });
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await changePassword(form);
      setForm({ currentPassword: '', newPassword: '' });
      showToast('Password changed');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="card" style={{ padding: 24 }}>
      <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 18 }}>Change password</h2>
      <form onSubmit={save} style={{ display: 'grid', gap: 14, maxWidth: 420 }}>
        <div>
          <label>Current password</label>
          <input type="password" required value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} />
        </div>
        <div>
          <label>New password</label>
          <input type="password" required minLength={8} value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} />
        </div>
        <div>
          <button className="btn" disabled={saving}>{saving ? 'Saving…' : 'Change password'}</button>
        </div>
      </form>
    </section>
  );
};