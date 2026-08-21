import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAddresses, createAddress, initializePayment } from '../api';
import type { Address } from '../types';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../api/client';

export const Checkout = () => {
  const { items, subtotal } = useCart();
  const { showToast } = useToast();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [placing, setPlacing] = useState(false);

  const [form, setForm] = useState({
    label: 'Home',
    recipientName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    country: 'Nigeria',
    postalCode: '',
  });

  useEffect(() => {
    getAddresses()
      .then((data) => {
        setAddresses(data.addresses);
        const def = data.addresses.find((a) => a.isDefault) ?? data.addresses[0];
        if (def) setSelectedAddress(def._id);
      })
      .catch(() => {});
  }, []);

  const deliveryFee = 0;
  const total = subtotal + deliveryFee;

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { address } = await createAddress(form);
      setAddresses((prev) => [...prev, address]);
      setSelectedAddress(address._id);
      setShowNewForm(false);
      showToast('Address saved');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const placeOrder = async () => {
    if (!selectedAddress || items.length === 0) return;
    setPlacing(true);
    try {
      const callbackUrl = `${window.location.origin}/order-success?reference={{reference}}`;
      const data = await initializePayment({
        items: items.map((it) => ({ product: it.product._id, quantity: it.quantity, size: it.size })),
        deliveryAddressId: selectedAddress,
        callbackUrl,
      });
      // Remember the real reference so the success page still shows the correct
      // one even if Paystack does not substitute {{reference}} in the callback URL.
      sessionStorage.setItem('rh_pending_ref', data.reference);
      window.location.href = data.authorizationUrl;
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
      setPlacing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <h2>Your cart is empty</h2>
        <Link to="/shop" className="btn" style={{ marginTop: 20 }}>Go to shop</Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <h1 style={{ fontSize: 30, fontWeight: 800, marginBottom: 24 }}>Checkout</h1>

      <div className="aside-right">
        <div>
          <section className="card" style={{ padding: 20, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800 }}>Delivery address</h2>
              <button className="btn btn-outline btn-sm" onClick={() => setShowNewForm((s) => !s)} type="button">
                {showNewForm ? 'Cancel' : '+ Add new'}
              </button>
            </div>

            {addresses.length === 0 && !showNewForm && (
              <p className="text-muted" style={{ marginBottom: 12 }}>No saved addresses yet. Add one to continue.</p>
            )}

            {addresses.length > 0 && (
              <div style={{ display: 'grid', gap: 10 }}>
                {addresses.map((a) => (
                  <label
                    key={a._id}
                    style={{
                      display: 'flex',
                      gap: 12,
                      padding: 14,
                      border: selectedAddress === a._id ? '2px solid #000' : '1px solid var(--c-border)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="radio"
                      name="address"
                      checked={selectedAddress === a._id}
                      onChange={() => setSelectedAddress(a._id)}
                      style={{ width: 'auto' }}
                    />
                    <div style={{ fontSize: 14 }}>
                      <div style={{ fontWeight: 700 }}>
                        {a.label}
                        {a.isDefault && <span className="badge" style={{ marginLeft: 8 }}>Default</span>}
                      </div>
                      <div className="text-muted">{a.recipientName} · {a.phone}</div>
                      <div className="text-muted">{a.street}, {a.city}, {a.state}, {a.country}{a.postalCode ? ` ${a.postalCode}` : ''}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {showNewForm && (
              <form onSubmit={handleAddAddress} className="form-2" style={{ marginTop: 16 }}>
                <div>
                  <label>Label</label>
                  <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Home / Office" />
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
                  <button className="btn" type="submit">Save address</button>
                </div>
              </form>
            )}
          </section>

          <section className="card" style={{ padding: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 14 }}>Items</h2>
            <div style={{ display: 'grid', gap: 12 }}>
              {items.map(({ product, quantity, size }) => (
                <div key={`${product._id}-${size ?? ''}`} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 14 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{product.name}</div>
                    <div className="text-muted" style={{ fontSize: 12 }}>
                      {quantity} × ₦{(product.finalPrice ?? product.price).toLocaleString()}{size ? ` · ${size}` : ''}
                    </div>
                  </div>
                  <span style={{ fontWeight: 600 }}>₦{((product.finalPrice ?? product.price) * quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="card" style={{ padding: 20, position: 'sticky', top: 84 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 14 }}>Summary</h2>
          <div style={{ display: 'grid', gap: 10, fontSize: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">Subtotal</span>
              <span>₦{subtotal.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">Delivery</span>
              <span>Free</span>
            </div>
            <div style={{ borderTop: '1px solid var(--c-border)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
              <span>Total</span>
              <span>₦{total.toLocaleString()}</span>
            </div>
          </div>
          <p className="text-muted" style={{ fontSize: 12, marginTop: 12 }}>
            You will be redirected to Paystack to complete your payment securely.
          </p>
          <button className="btn btn-block" style={{ marginTop: 16 }} disabled={placing || !selectedAddress} onClick={placeOrder}>
            {placing ? 'Contacting Paystack…' : 'Pay now with Paystack'}
          </button>
        </div>
      </div>
    </div>
  );
};