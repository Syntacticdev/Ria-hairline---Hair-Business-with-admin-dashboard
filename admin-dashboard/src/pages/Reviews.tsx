import { useEffect, useState, useCallback } from 'react';
import { getAllReviews, approveReview, rejectReview } from '../api';
import type { Review } from '../types';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../api';

export const Reviews = () => {
  const { showToast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvedFilter, setApprovedFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const load = useCallback(() => {
    setLoading(true);
    const params: Record<string, unknown> = { page };
    if (approvedFilter === 'true') params.approved = true;
    if (approvedFilter === 'false') params.approved = false;
    getAllReviews(params)
      .then((data) => {
        setReviews(data.reviews);
        setPages(data.pagination.pages);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, approvedFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const approve = async (id: string) => {
    try {
      await approveReview(id);
      showToast('Review approved');
      load();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const reject = async (id: string) => {
    try {
      await rejectReview(id);
      showToast('Review rejected');
      load();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 20 }}>Reviews</h1>

      <select
        value={approvedFilter}
        onChange={(e) => {
          setApprovedFilter(e.target.value);
          setPage(1);
        }}
        style={{ width: 200, marginBottom: 18 }}
      >
        <option value="">All reviews</option>
        <option value="false">Pending approval</option>
        <option value="true">Approved</option>
      </select>

      <div className="card" style={{ overflowX: 'auto' }}>
        {loading ? (
          <p className="text-muted" style={{ padding: 20 }}>Loading…</p>
        ) : reviews.length === 0 ? (
          <p className="text-muted" style={{ padding: 20 }}>No reviews found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Customer</th>
                <th>Rating</th>
                <th>Review</th>
                <th>Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((r) => (
                <tr key={r._id}>
                  <td style={{ fontWeight: 600 }}>{r.product?.name ?? r.product?._id ?? '—'}</td>
                  <td>{r.user ? `${r.user.firstName} ${r.user.lastName}` : '—'}</td>
                  <td>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)} </td>
                  <td className="truncate" style={{ maxWidth: 280 }}>
                    {r.title && <span style={{ fontWeight: 700 }}>{r.title} — </span>}
                    {r.comment}
                  </td>
                  <td className="text-muted">{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td>
                    <span className="badge" style={{ borderColor: r.isApproved ? '#14532d' : 'var(--c-border)', color: r.isApproved ? '#14532d' : 'inherit' }}>
                      {r.isApproved ? 'Approved' : 'Pending'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      {!r.isApproved && (
                        <button className="btn btn-outline btn-sm" onClick={() => approve(r._id)}>Approve</button>
                      )}
                      {r.isApproved && (
                        <button className="btn btn-outline btn-sm" onClick={() => reject(r._id)}>Reject</button>
                      )}
                    </div>
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