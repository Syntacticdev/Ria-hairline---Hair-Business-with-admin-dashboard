import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getAllOrders, updateOrderStatus } from '../api';
import type { Order, OrderStatus } from '../types';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../api';

const ORDER_STATUSES: OrderStatus[] = ['pending', 'processing', 'shipped', 'in_transit', 'delivered', 'cancelled', 'refunded'];
const PAYMENT_STATUSES = ['paid', 'pending', 'failed'];

const STATUS_COLORS: Record<string, string> = {
  pending: 'var(--c-text-muted)',
  processing: 'var(--c-text-muted)',
  shipped: 'var(--c-text)',
  in_transit: '#b45309',
  delivered: '#14532d',
  cancelled: '#991515',
  refunded: '#991515',
};

export const Orders = () => {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const load = useCallback(() => {
    setLoading(true);
    getAllOrders({ page, search, status, paymentStatus })
      .then((data) => {
        setOrders(data.orders);
        setPages(data.pagination.pages);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, search, status, paymentStatus]);

  useEffect(() => {
    load();
  }, [load]);

  const changeStatus = async (order: Order, next: OrderStatus) => {
    try {
      await updateOrderStatus(order._id, next);
      showToast('Order status updated');
      load();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const userName = (o: Order) => {
    if (typeof o.user === 'string') return o.user;
    return `${o.user.firstName} ${o.user.lastName}`;
  };

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 20 }}>Orders</h1>

      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search order number or reference…"
          style={{ maxWidth: 320 }}
        />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} style={{ width: 160 }}>
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select value={paymentStatus} onChange={(e) => { setPaymentStatus(e.target.value); setPage(1); }} style={{ width: 160 }}>
          <option value="">All payments</option>
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        {loading ? (
          <p className="text-muted" style={{ padding: 20 }}>Loading…</p>
        ) : orders.length === 0 ? (
          <p className="text-muted" style={{ padding: 20 }}>No orders found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Date</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Update</th>
                <th style={{ textAlign: 'right' }}></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id}>
                  <td style={{ fontWeight: 600 }}>{o.orderNumber}</td>
                  <td>{userName(o)}</td>
                  <td className="text-muted">{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>₦{o.totalAmount.toLocaleString()}</td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        borderColor: o.paymentStatus === 'paid' ? '#14532d' : o.paymentStatus === 'failed' ? '#991515' : 'inherit',
                        color: o.paymentStatus === 'paid' ? '#14532d' : o.paymentStatus === 'failed' ? '#991515' : 'inherit',
                      }}
                    >
                      {o.paymentStatus}
                    </span>
                  </td>
                  <td>
                    <span className="badge" style={{ color: STATUS_COLORS[o.orderStatus] ?? 'inherit', borderColor: 'currentColor' }}>
                      {o.orderStatus}
                    </span>
                  </td>
                  <td>
                    <select
                      value={o.orderStatus}
                      onChange={(e) => changeStatus(o, e.target.value as OrderStatus)}
                      style={{ width: 110, padding: '6px 8px' }}
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <Link to={`/admin/orders/${o._id}`} className="btn btn-outline btn-sm">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {pages > 1 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 20 }}>
          <button className="btn btn-outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
          <span className="text-muted" style={{ alignSelf: 'center', fontSize: 14 }}>Page {page} of {pages}</span>
          <button className="btn btn-outline" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}
    </div>
  );
};