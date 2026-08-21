import { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getOrder, updateOrderStatus } from '../api';
import type { Order, OrderStatus } from '../types';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../api';

const ORDER_STATUSES: OrderStatus[] = ['pending', 'processing', 'shipped', 'in_transit', 'delivered', 'cancelled', 'refunded'];

const STATUS_COLORS: Record<string, string> = {
  pending: 'var(--c-text-muted)',
  processing: 'var(--c-text-muted)',
  shipped: 'var(--c-text)',
  in_transit: '#b45309',
  delivered: '#14532d',
  cancelled: '#991515',
  refunded: '#991515',
};

export const OrderDetail = () => {
  const { id } = useParams();
  const { showToast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    getOrder(id)
      .then(setOrder)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const changeStatus = async (next: OrderStatus) => {
    if (!order) return;
    setSaving(true);
    try {
      await updateOrderStatus(order._id, next);
      showToast('Order status updated');
      load();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

if (loading) return <p className="text-muted">Loading…</p>;
  if (!order) return <p className="text-muted">Order not found.</p>;

  const customer = typeof order.user === 'object' ? order.user : null;
  const addr = order.shippingAddress;

  const row = (label: string, value: string | undefined) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, fontSize: 14 }}>
      <span className="text-muted">{label}</span>
      <span style={{ fontWeight: 600, textAlign: 'right' }}>{value ?? '—'}</span>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <Link to="/admin/orders" className="btn btn-outline btn-sm">← Back to orders</Link>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>{order.orderNumber}</h1>
        <span className="badge" style={{ borderColor: STATUS_COLORS[order.orderStatus] ?? 'currentColor', color: STATUS_COLORS[order.orderStatus] ?? 'inherit' }}>
          {order.orderStatus}
        </span>
      </div>

      <div className="admin-grid-2">
        <div style={{ display: 'grid', gap: 16 }}>
          <section className="card" style={{ padding: 20 }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Items</h2>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th style={{ textAlign: 'right' }}>Qty</th>
                  <th style={{ textAlign: 'right' }}>Unit</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((it) => (
                  <tr key={it.product}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {it.image && <img src={it.image} alt={it.name} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--c-border)' }} />}
                        <div>
                          <div style={{ fontWeight: 600 }}>{it.name}</div>
                          {it.size && <div className="text-muted" style={{ fontSize: 12 }}>Size: {it.size}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>{it.quantity}</td>
                    <td style={{ textAlign: 'right' }}>₦{it.unitPrice.toLocaleString()}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>₦{it.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'grid', gap: 8, marginTop: 16, borderTop: '1px solid var(--c-border)', paddingTop: 14 }}>
              {row('Subtotal', `₦${order.subtotal.toLocaleString()}`)}
              {row('Delivery fee', order.deliveryFee > 0 ? `₦${order.deliveryFee.toLocaleString()}` : 'Free')}
              {row('Discount', order.discount > 0 ? `-₦${order.discount.toLocaleString()}` : '₦0')}
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, fontSize: 15 }}>
                <strong>Total</strong>
                <strong>₦{order.totalAmount.toLocaleString()}</strong>
              </div>
            </div>
          </section>

          <section className="card" style={{ padding: 20 }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Delivery address</h2>
            <div style={{ display: 'grid', gap: 8 }}>
              {addr && (
                <>
                  {row('Recipient', [addr.recipientName, addr.label ? `(${addr.label})` : ''].filter(Boolean).join(' '))}
                  {row('Phone', addr.phone)}
                  {row('Address', addr.street)}
                  {row('City', addr.city)}
                  {row('State', addr.state)}
                  {row('Country', addr.country)}
                  {row('Postal code', addr.postalCode)}
                </>
              )}
            </div>
          </section>
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          <section className="card" style={{ padding: 20 }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Customer</h2>
            {customer ? (
              <div style={{ display: 'grid', gap: 8 }}>
                {row('Name', `${customer.firstName} ${customer.lastName}`)}
                {row('Email', customer.email)}
                {customer.phone ? row('Phone', customer.phone) : null}
              </div>
            ) : (
              <p className="text-muted" style={{ fontSize: 14 }}>No customer details.</p>
            )}
          </section>

          <section className="card" style={{ padding: 20 }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment</h2>
            <div style={{ display: 'grid', gap: 8 }}>
              {row('Reference', order.paymentReference)}
              {row('Method', order.paymentMethod)}
              {row('Payment', order.paymentStatus)}
              {row('Placed', new Date(order.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }))}
            </div>
          </section>

          <section className="card" style={{ padding: 20 }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Delivery status</h2>
            <p className="text-muted" style={{ fontSize: 13, marginBottom: 12 }}>
              Update the fulfilment status below. Reviews are enabled for the customer once the order is marked{' '}
              <strong>delivered</strong>.
            </p>
            <select
              value={order.orderStatus}
              onChange={(e) => changeStatus(e.target.value as OrderStatus)}
              disabled={saving}
              style={{ width: '100%', padding: '8px 10px' }}
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {saving && <p className="text-muted" style={{ fontSize: 12, marginTop: 8 }}>Saving…</p>}
          </section>

          {order.notes && (
            <section className="card" style={{ padding: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 800, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notes</h2>
              <p style={{ fontSize: 14 }}>{order.notes}</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};