import { useEffect, useState } from 'react';
import { getAddresses, createAddress, updateAddress, setDefaultAddress, deleteAddress } from '../../api';
import type { Address } from '../../types';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../api/client';

const emptyForm = { label: 'Home', recipientName: '', phone: '', street: '', city: '', state: '', country: 'Nigeria', postalCode: '' };

export const AddressBook = () => {
  const { showToast } = useToast();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAddresses();
      setAddresses(data.addresses);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (a: Address) => {
    setEditing(a);
    setForm({
      label: a.label,
      recipientName: a.recipientName,
      phone: a.phone,
      street: a.street,
      city: a.city,
      state: a.state,
      country: a.country,
      postalCode: a.postalCode ?? '',
    });
    setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await updateAddress(editing._id, form);
        showToast('Address updated');
      } else {
        await createAddress(form);
        showToast('Address added');
      }
      setShowForm(false);
      setEditing(null);
      setForm(emptyForm);
      await load();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const setDefault = async (id: string) => {
    try {
      await setDefaultAddress(id);
      await load();
      showToast('Default address updated');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      await deleteAddress(id);
      await load();
      showToast('Address deleted');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800 }}>Addresses</h2>
        <button
          className="btn btn-outline btn-sm"
          onClick={() => {
            setEditing(null);
            setForm(emptyForm);
            setShowForm((s) => !s);
          }}
          type="button"
        >
          {showForm && !editing ? 'Cancel' : '+ Add address'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={save} className="card form-2" style={{ padding: 20, marginBottom: 20 }}>
          <div>
            <label>Label</label>
            <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          </div>
          <div>
            <label>Recipient name</label>
            <input required value={form.recipientName} onChange={(e) => setForm({ ...form, recipientName: e.target.value })} />
          </div>
          <div>
            <label>Phone</label>
            <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label>Street address</label>
            <input required value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} />
          </div>
          <div>
            <label>City</label>
            <input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
          <div>
            <label>State</label>
            <input required value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
          </div>
          <div>
            <label>Country</label>
            <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
          </div>
          <div>
            <label>Postal code</label>
            <input value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <button className="btn" disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Update address' : 'Save address'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-muted">Loading…</p>
      ) : addresses.length === 0 ? (
        <div className="card" style={{ padding: 24 }}>
          <p className="text-muted">No saved addresses. Add your first delivery address.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {addresses.map((a) => (
            <div key={a._id} className="card" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 14 }}>
                <div style={{ fontWeight: 700 }}>
                  {a.label}
                  {a.isDefault && <span className="badge" style={{ marginLeft: 8 }}>Default</span>}
                </div>
                <div className="text-muted">{a.recipientName} · {a.phone}</div>
                <div className="text-muted">{a.street}, {a.city}, {a.state}, {a.country}{a.postalCode ? ` ${a.postalCode}` : ''}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                {!a.isDefault && (
                  <button className="btn btn-outline btn-sm" onClick={() => setDefault(a._id)} type="button">Set default</button>
                )}
                <button className="btn btn-outline btn-sm" onClick={() => startEdit(a)} type="button">Edit</button>
                <button className="btn btn-outline btn-sm" onClick={() => remove(a._id)} type="button">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};