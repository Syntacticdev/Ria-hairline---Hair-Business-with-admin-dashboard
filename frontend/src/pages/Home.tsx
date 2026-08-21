import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getFeaturedProducts, getCategories, getProducts } from '../api';
import type { Product } from '../types';
import { ProductCard } from '../components/ProductCard';

export const Home = () => {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const PREVIEW_COUNT = 4;

  useEffect(() => {
    Promise.all([getFeaturedProducts(), getCategories(), getProducts({ page: 1, limit: PREVIEW_COUNT })])
      .then(([f, c, g]) => {
        setFeatured(f.products);
        setCategories(c.categories);
        setNewArrivals(g.products);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <section style={{ borderBottom: '1px solid var(--c-border)', background: '#fafafa' }}>
        <div className="container grid-2-1" style={{ padding: '64px 14px 56px' }}>
          <div>
            <div className="badge" style={{ marginBottom: 16 }}>Premium Hair Collections</div>
            <h1 style={{ fontSize: 'clamp(34px, 5vw, 56px)', lineHeight: 1.05, fontWeight: 800 }}>
              Hair that speaks.
              <br />
              Confidence that shouts.
            </h1>
            <p className="text-muted" style={{ fontSize: 16, maxWidth: 460, margin: '18px 0 28px' }}>
              Shop premium human hair, wigs and styling products. Browsing is free — order only when you are ready.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link to="/shop" className="btn">Shop now</Link>
              <Link to="/shop" className="btn btn-outline">Browse categories</Link>
            </div>
          </div>
          <div
            style={{
              aspectRatio: '4/5',
              background: 'linear-gradient(135deg, #d4d4d4, #f5f5f5)',
              borderRadius: 'var(--radius)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(10,10,10,0.6)',
              fontSize: 15,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            RIA
            <br />
            HAIRLINE
          </div>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="container" style={{ padding: '40px 20px 0' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {categories.map((c) => (
              <Link key={c} to={`/shop?category=${encodeURIComponent(c)}`} className="btn btn-outline btn-sm">
                {c}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="container" style={{ padding: '48px 20px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20 }}>
          <h2 style={{ fontSize: 26, fontWeight: 800 }}>Featured products</h2>
          <Link to="/shop" className="text-muted" style={{ fontSize: 14 }}>View all →</Link>
        </div>
        {loading ? (
          <div className="prod-grid">
            {Array.from({ length: PREVIEW_COUNT }).map((_, i) => (
              <div key={i} className="skeleton" style={{ aspectRatio: '3/4' }} />
            ))}
          </div>
        ) : featured.length === 0 ? (
          <p className="text-muted">No featured products yet. Check back soon.</p>
        ) : (
          <div className="prod-grid">
            {featured.slice(0, PREVIEW_COUNT).map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </section>

      <section className="container" style={{ padding: '48px 14px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20 }}>
          <h2 style={{ fontSize: 26, fontWeight: 800 }}>New arrivals</h2>
          <Link to="/shop" className="text-muted" style={{ fontSize: 14 }}>View all →</Link>
        </div>
        {loading ? (
          <div className="prod-grid">
            {Array.from({ length: PREVIEW_COUNT }).map((_, i) => (
              <div key={i} className="skeleton" style={{ aspectRatio: '3/4' }} />
            ))}
          </div>
        ) : newArrivals.length === 0 ? (
          <p className="text-muted">Products are on their way. Check back soon.</p>
        ) : (
          <div className="prod-grid">
            {newArrivals.slice(0, PREVIEW_COUNT).map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}

        {!loading && newArrivals.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <Link to="/shop" className="btn btn-outline" style={{ minWidth: 220 }}>
              Shop more →
            </Link>
          </div>
        )}
      </section>

      <section className="container" style={{ padding: '48px 20px 0', textAlign: 'center' }}>
        <div className="card" style={{ padding: '48px 24px' }}>
          <h2 style={{ fontSize: 26, fontWeight: 800 }}>Why shop with Ria Hairline?</h2>
          <p className="text-muted" style={{ maxWidth: 560, margin: '10px auto 28px' }}>
            Secure checkout powered by Paystack, multiple product angles for full clarity, and fast delivery to your door.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {[
              ['Multiple angles', 'Every product shows up to 4 photos so you know exactly what you are buying.'],
              ['Secure payments', 'Payments handled by Paystack with automatic order confirmation.'],
              ['Multiple addresses', 'Save several delivery addresses and pick the right one at checkout.'],
            ].map(([title, desc]) => (
              <div key={title} style={{ borderTop: '2px solid #000', paddingTop: 14, textAlign: 'left' }}>
                <div style={{ fontWeight: 700 }}>{title}</div>
                <div className="text-muted" style={{ fontSize: 13, marginTop: 6 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};