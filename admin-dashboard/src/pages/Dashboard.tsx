import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getStats } from '../api';
import type { Order, Stats } from '../types';

const STATUS_COLORS: Record<string, string> = {
  pending: 'var(--c-text-muted)',
  processing: 'var(--c-text-muted)',
  shipped: 'var(--c-text)',
  delivered: '#14532d',
  cancelled: '#991515',
  refunded: '#991515',
};

type StatsData = Omit<Stats, 'recentOrders'>;

export const Dashboard = () => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [recent, setRecent] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStats()
      .then((data) => {
        setStats(data.stats);
        setRecent(data.recentOrders);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cards: { label: string; value: string; to: string }[] = stats
    ? [
        { label: 'Revenue', value: `₦${stats.totalRevenue.toLocaleString()}`, to: '/admin/orders' },
        { label: 'Orders', value: stats.totalOrders.toLocaleString(), to: '/admin/orders' },
        { label: 'Products', value: stats.totalProducts.toLocaleString(), to: '/admin/products' },
        { label: 'Customers', value: stats.totalUsers.toLocaleString(), to: '/admin/users' },
        { label: 'Low stock', value: stats.lowStock.toLocaleString(), to: '/admin/products' },
        { label: 'Pending reviews', value: stats.pendingReviews.toLocaleString(), to: '/admin/reviews' },
      ]
    : [];

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 24 }}>Dashboard</h1>

      {loading ? (
        <p className="text-muted">Loading…</p>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
            {cards.map((c) => (
              <Link key={c.label} to={c.to} className="card" style={{ padding: 18 }}>
                <div className="text-muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{c.label}</div>
                <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8 }}>{c.value}</div>
              </Link>
            ))}
          </div>

          <div className="card">
            <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--c-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 16, fontWeight: 800 }}>Recent paid orders</h2>
              <Link to="/admin/orders" className="btn btn-outline btn-sm">View all</Link>
            </div>
            {recent.length === 0 ? (
              <p className="text-muted" style={{ padding: 24 }}>No paid orders yet.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((o) => (
                    <tr key={o._id}>
                      <td>{o.orderNumber}</td>
                      <td className="text-muted">{new Date(o.createdAt).toLocaleDateString()}</td>
                      <td>
                        <span className="badge" style={{ color: STATUS_COLORS[o.orderStatus] ?? 'inherit', borderColor: 'currentColor' }}>
                          {o.orderStatus}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>₦{o.totalAmount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
};