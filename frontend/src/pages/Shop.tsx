import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getProducts, getCategories } from '../api';
import type { Product } from '../types';
import { ProductCard } from '../components/ProductCard';

const LIMIT = 12;

export const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category') ?? '';
  const search = searchParams.get('search') ?? '';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCategories()
      .then((c) => setCategories(c.categories))
      .catch(() => {});
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    const params: Record<string, unknown> = { page, limit: LIMIT };
    if (category) params.category = category;
    if (search) params.search = search;
    getProducts(params)
      .then((data) => {
        setProducts(data.products);
        setTotal(data.pagination.total);
        setPages(data.pagination.pages);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, category, search]);

  useEffect(() => {
    load();
  }, [load]);

  const selectCategory = (c: string) => {
    const next = new URLSearchParams(searchParams);
    if (c) next.set('category', c);
    else next.delete('category');
    setSearchParams(next, { replace: true });
    setPage(1);
  };

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 30, fontWeight: 800 }}>Shop</h1>
          {search && <p className="text-muted">Search results for “{search}”</p>}
        </div>
        <form
          style={{ display: 'flex', gap: 8, width: '100%', maxWidth: 380, marginLeft: 'auto' }}
          onSubmit={(e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            const q = String(form.get('search') ?? '').trim();
            const next = new URLSearchParams(searchParams);
            if (q) next.set('search', q);
            else next.delete('search');
            setSearchParams(next, { replace: true });
            setPage(1);
          }}
        >
          <input name="search" defaultValue={search} placeholder="Search products…" />
          <button type="submit" className="btn">Search</button>
        </form>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
        <button
          onClick={() => selectCategory('')}
          className={`btn btn-sm ${category ? 'btn-outline' : ''}`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => selectCategory(c)}
            className={`btn btn-sm ${category === c ? '' : 'btn-outline'}`}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="prod-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ aspectRatio: '3/4' }} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <p className="text-muted" style={{ padding: '40px 0' }}>No products match your filters.</p>
      ) : (
        <div className="prod-grid">
          {products.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}

      {pages > 1 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 32 }}>
          <button className="btn btn-outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </button>
          <span style={{ alignSelf: 'center', fontSize: 14 }} className="text-muted">
            Page {page} of {pages} · {total} products
          </span>
          <button className="btn btn-outline" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
            Next
          </button>
        </div>
      )}
    </div>
  );
};