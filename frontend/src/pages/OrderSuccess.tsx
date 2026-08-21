import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export const OrderSuccess = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { items, clearCart } = useCart();

  const queryRef = searchParams.get('reference');
  // Fall back to the reference captured at initialize time when Paystack leaves
  // the {{reference}} placeholder in the callback URL instead of substituting it.
  const reference =
    queryRef && queryRef !== '{{reference}}' ? queryRef : sessionStorage.getItem('rh_pending_ref');

  useEffect(() => {
    // Only clear the (now submitted) cart when needed, and keep the effect
    // dependency stable so it never loops.
    if (items.length > 0) clearCart();
  }, [items.length, clearCart]);

  useEffect(() => {
    sessionStorage.removeItem('rh_pending_ref');
    if (queryRef && queryRef === '{{reference}}') {
      setSearchParams({}, { replace: true });
    }
    // The order is persisted server-side once Paystack confirms the payment via
    // webhook. We simply acknowledge here.
  }, [queryRef, setSearchParams]);

  return (
    <div className="container" style={{ padding: '80px 20px', maxWidth: 640, textAlign: 'center' }}>
      <div
        style={{
          width: 64,
          height: 64,
          margin: '0 auto 20px',
          borderRadius: 999,
          background: '#000',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 30,
          fontWeight: 800,
        }}
      >
        ✓
      </div>
      <h1 style={{ fontSize: 26, fontWeight: 800 }}>Payment submitted — order in process</h1>
      <p className="text-muted" style={{ marginTop: 10 }}>
        Your order is now being processed. Once Paystack confirms your payment, the order will be
        confirmed and the products will move through fulfilment.
      </p>

      {reference && (
        <div className="card" style={{ padding: 20, textAlign: 'left', marginTop: 24 }}>
          <div style={{ fontSize: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">Payment reference</span>
              <span style={{ fontWeight: 600 }}>{reference}</span>
            </div>
          </div>
        </div>
      )}

      <p className="text-muted" style={{ fontSize: 12, marginTop: 14 }}>
        Keep the reference above if you need to follow up with support.
      </p>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
        <Link to="/account/orders" className="btn">View my orders</Link>
        <Link to="/shop" className="btn btn-outline">Continue shopping</Link>
      </div>
    </div>
  );
};