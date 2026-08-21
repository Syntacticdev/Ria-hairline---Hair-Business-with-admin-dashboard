import { Link } from 'react-router-dom';
import type { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

export const ProductCard = ({ product }: { product: Product }) => {
  const { addItem } = useCart();
  const { showToast } = useToast();
  const finalPrice = product.finalPrice ?? product.price;
  const hasDiscount = product.discountPrice !== undefined && product.discountPrice > 0;

  return (
    <div className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <Link to={`/product/${product._id}`} style={{ position: 'relative', display: 'block', aspectRatio: '1/1', background: 'var(--c-surface)' }}>
        <img
          src={product.images[0]}
          alt={product.name}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        {product.stock === 0 && (
          <span style={{ position: 'absolute', top: 10, left: 10 }} className="badge">
            Sold out
          </span>
        )}
        {hasDiscount && (
          <span style={{ position: 'absolute', top: 10, right: 10 }} className="badge">
            Sale
          </span>
        )}
      </Link>
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        <div className="text-muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {product.category}
        </div>
        <Link to={`/product/${product._id}`} style={{ fontWeight: 600, fontSize: 15, lineHeight: 1.3 }}>
          {product.name}
        </Link>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>
            ₦{finalPrice.toLocaleString()}
          </span>
          {hasDiscount && (
            <span className="text-muted" style={{ textDecoration: 'line-through', fontSize: 13 }}>
              ₦{product.price.toLocaleString()}
            </span>
          )}
        </div>
        {product.ratingsCount > 0 && (
          <div className="text-muted" style={{ fontSize: 12 }}>
            ★ {product.ratingsAverage.toFixed(1)} ({product.ratingsCount})
          </div>
        )}
        <div style={{ marginTop: 'auto', paddingTop: 8 }}>
          <button
            className="btn btn-block"
            disabled={product.stock === 0}
            onClick={() => {
              addItem(product, 1);
              showToast('Added to cart');
            }}
          >
            {product.stock === 0 ? 'Out of stock' : 'Add to cart'}
          </button>
        </div>
      </div>
    </div>
  );
};