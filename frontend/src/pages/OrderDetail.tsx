import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getOrder, cancelOrder, getMyReviews, createReview } from '../api';
import type { Order, MyReview } from '../types';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../api/client';
import { StarRating } from '../components/StarRating';

export const OrderDetail = () => {
  const { id = '' } = useParams();
  const { showToast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const [myReviews, setMyReviews] = useState<MyReview[]>([]);
  const [openForm, setOpenForm] = useState<string | null>(null);
  const [form, setForm] = useState({ rating: 5, title: '', comment: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([getOrder(id), getMyReviews()])
      .then(([o, reviews]) => {
        setOrder(o.order);
        setMyReviews(reviews);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const reviewFor = (productId: string) => myReviews.find((r) => r.product === productId);

  const openReview = (productId: string) => {
    setForm({ rating: 5, title: '', comment: '' });
    setOpenForm(productId);
  };

  const submitReview = async (productId: string) => {
    if (!form.comment.trim()) return;
    setSubmitting(true);
    try {
      const { review } = await createReview(productId, { rating: form.rating, title: form.title, comment: form.comment });
      setMyReviews((prev) => [
        ...prev,
        {
          _id: review._id,
          product: productId,
          rating: form.rating,
          title: form.title || undefined,
          comment: form.comment,
          isApproved: false,
          createdAt: new Date().toISOString(),
        },
      ]);
      setOpenForm(null);
      showToast('Review submitted. Thank you for your feedback!');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const cancel = async () => {
    if (!window.confirm('Cancel this order?')) return;
    setCancelling(true);
    try {
      await cancelOrder(id);
      setOrder((prev) => (prev ? { ...prev, orderStatus: 'cancelled', paymentStatus: 'failed' } : prev));
      showToast('Order cancelled');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return <div className="container" style={{ padding: '40px 20px' }}>Loading…</div>;
  }

  if (!order) {
    return (
      <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <h2>Order not found</h2>
        <Link to="/account/orders" className="btn" style={{ marginTop: 20 }}>Back to my orders</Link>
      </div>
    );
  }

  const delivered = order.orderStatus === 'delivered' && order.paymentStatus === 'paid';
  const canCancel = ['pending', 'processing'].includes(order.orderStatus) && order.paymentStatus !== 'paid';

  return (
    <div className="container" style={{ padding: '40px 20px', maxWidth: 760 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>Order {order.orderNumber}</h1>
          <div className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>
            Placed {new Date(order.createdAt).toLocaleString()}
          </div>
        </div>
        <span className="badge" style={{ textTransform: 'capitalize' }}>
          {order.orderStatus} · {order.paymentStatus}
        </span>
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        <section className="card" style={{ padding: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>Items</h2>
          <div style={{ display: 'grid', gap: 16 }}>
            {order.items.map((it, i) => {
              const review = reviewFor(it.product);
              const showForm = openForm === it.product;
              return (
                <div key={`${it.product}-${i}`} style={{ borderBottom: i < order.items.length - 1 ? '1px solid var(--c-border)' : 'none', paddingBottom: i < order.items.length - 1 ? 16 : 0 }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    {it.image && (
                      <img src={it.image} alt={it.name} style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 'var(--radius-sm)', background: 'var(--c-surface)' }} />
                    )}
                    <div style={{ flex: 1, fontSize: 14 }}>
                      <div style={{ fontWeight: 600 }}>{it.name}{it.size ? ` · ${it.size}` : ''}</div>
                      <div className="text-muted">{it.quantity} × ₦{it.unitPrice.toLocaleString()}</div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>₦{it.total.toLocaleString()}</div>
                  </div>

                  <div style={{ marginTop: 10, paddingLeft: it.image ? 68 : 0 }}>
                    {review ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="badge" style={{ borderColor: '#14532d', color: '#14532d' }}>Reviewed</span>
                        <StarRating value={review.rating} />
                        <span className="text-muted" style={{ fontSize: 12 }}>
                          {review.isApproved ? 'Live on product page' : 'Awaiting approval'}
                        </span>
                      </div>
                    ) : delivered ? (
                      showForm ? (
                        <div className="card" style={{ padding: 14, display: 'grid', gap: 10, background: 'var(--c-surface-alt, #fafafa)' }}>
                          <div>
                            <label>Your rating</label>
                            <StarRating value={form.rating} onChange={(v) => setForm((f) => ({ ...f, rating: v }))} />
                          </div>
                          <div>
                            <label>Title (optional)</label>
                            <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Great quality wig" />
                          </div>
                          <div>
                            <label htmlFor={`review-${it.product}`}>Your review</label>
                            <textarea id={`review-${it.product}`} rows={2} value={form.comment} onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))} placeholder="Share your experience…" />
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-sm" disabled={submitting || !form.comment.trim()} onClick={() => submitReview(it.product)}>
                              {submitting ? 'Submitting…' : 'Submit review'}
                            </button>
                            <button className="btn btn-outline btn-sm" disabled={submitting} onClick={() => setOpenForm(null)}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <button className="btn btn-outline btn-sm" onClick={() => openReview(it.product)}>Write a review</button>
                      )
                    ) : (
                      <div className="text-muted" style={{ fontSize: 12 }}>
                        {order.orderStatus === 'delivered' ? 'Reviews open once the payment is confirmed.' : 'You can review this item once your order is delivered.'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="card" style={{ padding: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>Delivery</h2>
          <div style={{ fontSize: 14 }}>
            <div style={{ fontWeight: 600 }}>{order.shippingAddress.recipientName}</div>
            <div className="text-muted">{order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state}</div>
            <div className="text-muted">{order.shippingAddress.country}</div>
            <div className="text-muted">{order.shippingAddress.phone}</div>
          </div>
        </section>

        <section className="card" style={{ padding: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>Summary</h2>
          <div style={{ display: 'grid', gap: 8, fontSize: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">Subtotal</span>
              <span>₦{order.subtotal.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">Delivery</span>
              <span>{order.deliveryFee === 0 ? 'Free' : `₦${order.deliveryFee.toLocaleString()}`}</span>
            </div>
            {order.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Discount</span>
                <span>-₦{order.discount.toLocaleString()}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, borderTop: '1px solid var(--c-border)', paddingTop: 10 }}>
              <span>Total</span>
              <span>₦{order.totalAmount.toLocaleString()}</span>
            </div>
            {order.paymentReference && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Reference</span>
                <span>{order.paymentReference}</span>
              </div>
            )}
          </div>
        </section>

        {canCancel && (
          <button className="btn btn-danger" disabled={cancelling} style={{ justifySelf: 'start' }} onClick={cancel}>
            {cancelling ? 'Cancelling…' : 'Cancel order'}
          </button>
        )}
      </div>
    </div>
  );
};