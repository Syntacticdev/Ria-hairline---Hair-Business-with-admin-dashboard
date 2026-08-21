import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyOrders } from '../../api';
import type { Order } from '../../types';

const STATUS_COLORS: Record<string, string> = {
  pending: 'var(--c-text-muted)',
  processing: 'var(--c-text-muted)',
  shipped: 'var(--c-text)',
  delivered: '#14532d',
  cancelled: '#991515',
  refunded: '#991515',
};

export const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyOrders(1)
      .then((data) => setOrders(data.orders))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section>
      <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 18 }}>My orders</h2>
      {loading ? (
        <p className="text-muted">Loading…</p>
      ) : orders.length === 0 ? (
        <div className="card" style={{ padding: 24 }}>
          <p className="text-muted">
            No orders yet. <Link to="/shop" style={{ textDecoration: 'underline' }}>Start shopping</Link>.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {orders.map((o) => (
            <div key={o._id} className="card" style={{ padding: 14, display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>
                  {o.orderNumber}
                  <span className="text-muted" style={{ fontWeight: 400, marginLeft: 8 }}>
                    {new Date(o.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>
                  {o.items.reduce((acc, it) => acc + it.quantity, 0)} items ·{' '}
                  {o.items.map((i) => i.name).slice(0, 2).join(', ')}
                  {o.items.length > 2 ? '…' : ''}
                </div>
                <span className="badge" style={{ marginTop: 8, color: STATUS_COLORS[o.orderStatus] ?? 'inherit', borderColor: 'currentColor' }}>
                  {o.orderStatus} · {o.paymentStatus}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800 }}>₦{o.totalAmount.toLocaleString()}</div>
                <Link to={`/order/${o._id}`} className="btn btn-outline btn-sm" style={{ marginTop: 10, display: 'inline-flex' }}>
                  View
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};