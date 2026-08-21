import { useEffect, useState, useCallback } from 'react';
import { getTransactions } from '../api';
import type { PaymentTransaction, TransactionSummary } from '../types';

const STATUSES = ['pending', 'success', 'failed', 'abandoned'] as const;
const STATUS_COLORS: Record<string, string> = {
  success: '#14532d',
  pending: 'var(--c-text-muted)',
  failed: '#991515',
  abandoned: '#991515',
};

const fmt = (n: number) => `₦${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

export const Transactions = () => {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const load = useCallback(() => {
    setLoading(true);
    getTransactions({ page, search, status })
      .then((data) => {
        setTransactions(data.transactions);
        setSummary(data.summary);
        setPages(data.pagination.pages);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, search, status]);

  useEffect(() => {
    load();
  }, [load]);

  const customerName = (t: PaymentTransaction) => {
    if (!t.user) return '—';
    if (typeof t.user === 'string') return t.user;
    return `${t.user.firstName} ${t.user.lastName}`;
  };

  const summaryCards = summary
    ? [
        { label: 'All transactions', value: summary.total, sub: fmt(summary.totalAmount) },
        { label: 'Successful', value: summary.successful, sub: fmt(summary.successfulAmount) },
        { label: 'Pending', value: summary.pending, sub: fmt(summary.pendingAmount) },
        { label: 'Failed', value: summary.failed, sub: fmt(summary.failedAmount) },
      ]
    : [];

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 20 }}>Transactions</h1>

      {summary && (
        <div className="admin-grid-4">
          {summaryCards.map((c) => (
            <div key={c.label} className="card" style={{ padding: 16 }}>
              <div className="text-muted" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{c.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>{c.value.toLocaleString()}</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{c.sub}</div>
            </div>
          ))}
        </div>
      )}

      {summary && (
        <div className="card" style={{ padding: 14, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <span className="text-muted" style={{ fontSize: 13 }}>Total accumulated volume: </span>
            <span style={{ fontWeight: 800, fontSize: 18 }}>{fmt(summary.totalAmount)}</span>
          </div>
          <div style={{ fontSize: 12 }}>
            <span className="text-muted">{summary.successful} successful · {summary.pending} pending · {summary.failed} failed</span>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search transaction reference…"
          style={{ maxWidth: 320 }}
        />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          style={{ width: 180 }}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        {loading ? (
          <p className="text-muted" style={{ padding: 20 }}>Loading…</p>
        ) : transactions.length === 0 ? (
          <p className="text-muted" style={{ padding: 20 }}>No transactions found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Customer</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th>Channel</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t._id}>
                  <td style={{ fontWeight: 600 }}>{t.reference}</td>
                  <td>{customerName(t)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>{fmt(t.amount)}</td>
                  <td className="text-muted">{t.paymentChannel ?? '—'}</td>
                  <td>
                    <span className="badge" style={{ borderColor: STATUS_COLORS[t.status] ?? 'currentColor', color: STATUS_COLORS[t.status] ?? 'inherit' }}>
                      {t.status}
                    </span>
                  </td>
                  <td className="text-muted">{new Date(t.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</td>
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