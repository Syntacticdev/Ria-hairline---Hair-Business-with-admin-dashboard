import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getProduct, getProductReviews } from '../api';
import type { Product, Review } from '../types';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { StarRating } from '../components/StarRating';

export const ProductDetail = () => {
  const { id = '' } = useParams();
  const { addItem } = useCart();
  const { showToast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeImg, setActiveImg] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [size, setSize] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getProduct(id), getProductReviews(id)])
      .then(([p, r]) => {
        setProduct(p.product);
        setReviews(r.reviews);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="grid-2" style={{ padding: '40px 14px' }}>
        <div className="skeleton" style={{ aspectRatio: '1/1' }} />
        <div className="skeleton" style={{ height: 300 }} />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <h2>Product not found</h2>
        <Link to="/shop" className="btn" style={{ marginTop: 20 }}>Back to shop</Link>
      </div>
    );
  }

  const finalPrice = product.finalPrice ?? product.price;
  const hasDiscount = product.discountPrice !== undefined && product.discountPrice > 0;

  const handleAddToCart = () => {
    addItem(product, quantity, size);
    showToast('Added to cart');
  };

  return (
    <div className="container" style={{ padding: '40px 14px' }}>
      <div className="grid-2">
        <div>
          <div
            style={{
              aspectRatio: '1/1',
              background: 'var(--c-surface)',
              borderRadius: 'var(--radius)',
              overflow: 'hidden',
            }}
          >
            <img src={product.images[activeImg]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          {product.images.length > 1 && (
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              {product.images.map((img, i) => (
                <button
                  key={img}
                  onClick={() => setActiveImg(i)}
                  style={{
                    width: 72,
                    height: 72,
                    padding: 0,
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                    border: i === activeImg ? '2px solid #000' : '1px solid var(--c-border)',
                    background: 'var(--c-surface)',
                  }}
                  aria-label={`View image ${i + 1}`}
                >
                  <img src={img} alt={`${product.name} angle ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="text-muted" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {product.category}
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, margin: '8px 0 12px' }}>{product.name}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <StarRating value={product.ratingsAverage} />
            <span className="text-muted" style={{ fontSize: 13 }}>
              {product.ratingsCount > 0 ? `${product.ratingsAverage.toFixed(1)} (${product.ratingsCount} reviews)` : 'No reviews yet'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 20 }}>
            <span style={{ fontSize: 28, fontWeight: 800 }}>₦{finalPrice.toLocaleString()}</span>
            {hasDiscount && <span className="text-muted" style={{ fontSize: 18, textDecoration: 'line-through' }}>₦{product.price.toLocaleString()}</span>}
          </div>

          <p style={{ lineHeight: 1.65, marginBottom: 24 }}>{product.description}</p>

          {product.sizes && product.sizes.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <label>Size</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    className={`btn btn-sm ${size === s ? '' : 'btn-outline'}`}
                    onClick={() => setSize(s)}
                    type="button"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--c-border)', borderRadius: 'var(--radius-sm)' }}>
              <button className="btn btn-ghost btn-sm" style={{ height: '100%' }} onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">−</button>
              <span style={{ minWidth: 48, textAlign: 'center', fontWeight: 700 }}>{quantity}</span>
              <button className="btn btn-ghost btn-sm" style={{ height: '100%' }} onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))} aria-label="Increase quantity">+</button>
            </div>
            <button className="btn" style={{ flex: 1 }} disabled={product.stock === 0} onClick={handleAddToCart}>
              {product.stock === 0 ? 'Out of stock' : 'Add to cart'}
            </button>
          </div>

          {product.stock > 0 && product.stock <= 10 && (
            <div className="text-muted" style={{ fontSize: 13, marginBottom: 20 }}>
              Only {product.stock} left in stock
            </div>
          )}
        </div>
      </div>

      <section style={{ marginTop: 56 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>Reviews</h2>
        <p className="text-muted" style={{ fontSize: 13, marginBottom: 20 }}>
          Reviews are left by customers for items they have purchased and received. You can review your
          purchased items from your <Link to="/account/orders">orders page</Link> once delivered.
        </p>

        <div style={{ display: 'grid', gap: 14 }}>
          {reviews.length === 0 ? (
            <p className="text-muted">No approved reviews yet.</p>
          ) : (
            reviews.map((r) => {
              const author = typeof r.user === 'string' ? null : r.user;
              return (
                <div key={r._id} className="card" style={{ padding: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>
                        {author ? `${author.firstName} ${author.lastName}` : 'Ria Hairline customer'}
                      </div>
                      <StarRating value={r.rating} />
                    </div>
                    <div className="text-muted" style={{ fontSize: 12 }}>
                      {new Date(r.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  {r.title && <div style={{ fontWeight: 600, marginTop: 8 }}>{r.title}</div>}
                  <p style={{ margin: '6px 0 0', lineHeight: 1.6, fontSize: 14 }}>{r.comment}</p>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
};