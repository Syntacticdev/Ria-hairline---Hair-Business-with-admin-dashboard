import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export const Cart = () => {
  const { items, updateQty, removeItem, subtotal, count } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const deliveryFee: number = 0;
  const total = subtotal + deliveryFee;

  const isOutOfStock = items.some((it) => it.quantity > it.product.stock);

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <h1 style={{ fontSize: 30, fontWeight: 800, marginBottom: 24 }}>Your cart</h1>

      {items.length === 0 ? (
        <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <p className="text-muted" style={{ marginBottom: 20 }}>Your cart is empty.</p>
          <Link to="/shop" className="btn">Start shopping</Link>
        </div>
      ) : (
        <div className="aside-right-320">
          <div style={{ display: 'grid', gap: 12 }}>
            {items.map(({ product, quantity, size }) => (
              <div key={`${product._id}-${size ?? ''}`} className="card" style={{ padding: 14, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <Link to={`/product/${product._id}`} style={{ width: 96, height: 96, borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: 'var(--c-surface)', flexShrink: 0 }}>
                  <img src={product.images[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </Link>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Link to={`/product/${product._id}`} style={{ fontWeight: 600 }}>
                    {product.name}
                  </Link>
                  {size && <span className="badge" style={{ alignSelf: 'flex-start' }}>Size: {size}</span>}
                  <span className="text-muted" style={{ fontSize: 13 }}>
                    ₦{(product.finalPrice ?? product.price).toLocaleString()} each
                  </span>
                  {product.stock < quantity && (
                    <span className="error-text">Only {product.stock} in stock</span>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--c-border)', borderRadius: 'var(--radius-sm)' }}>
                      <button className="btn btn-ghost btn-sm" style={{ height: '100%' }} onClick={() => updateQty(product._id, quantity - 1, size)} aria-label="Decrease">−</button>
                      <span style={{ minWidth: 36, textAlign: 'center', fontWeight: 700, fontSize: 14 }}>{quantity}</span>
                      <button className="btn btn-ghost btn-sm" style={{ height: '100%' }} onClick={() => updateQty(product._id, quantity + 1, size)} aria-label="Increase">+</button>
                    </div>
                    <button className="btn btn-outline btn-sm" onClick={() => removeItem(product._id, size)}>
                      Remove
                    </button>
                  </div>
                </div>
                <div style={{ fontWeight: 700, fontSize: 15, marginLeft: 'auto' }}>
                  ₦{((product.finalPrice ?? product.price) * quantity).toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: 20, position: 'sticky', top: 84 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 14 }}>Order summary</h2>
            <div style={{ display: 'grid', gap: 10, fontSize: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Items ({count})</span>
                <span>₦{subtotal.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Delivery</span>
                <span>{deliveryFee === 0 ? 'Free' : `₦${deliveryFee.toLocaleString()}`}</span>
              </div>
              <div style={{ borderTop: '1px solid var(--c-border)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
                <span>Total</span>
                <span>₦{total.toLocaleString()}</span>
              </div>
            </div>
            <button
              className="btn btn-block"
              style={{ marginTop: 16 }}
              disabled={isOutOfStock}
              onClick={() => (user ? navigate('/checkout') : navigate('/login'))}
            >
              {user ? 'Proceed to checkout' : 'Log in to checkout'}
            </button>
            {isOutOfStock && <p className="error-text" style={{ marginTop: 10 }}>Some items exceed available stock.</p>}
          </div>
        </div>
      )}
    </div>
  );
};