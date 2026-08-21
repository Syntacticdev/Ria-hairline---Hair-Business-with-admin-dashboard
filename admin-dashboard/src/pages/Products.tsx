import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getAllProducts, deleteProduct, toggleProduct } from '../api';
import type { Product } from '../types';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../api';

export const Products = () => {
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback(() => {
    setLoading(true);
    getAllProducts({ page, search })
      .then((data) => {
        setProducts(data.products);
        setPages(data.pagination.pages);
        setTotal(data.pagination.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (p: Product) => {
    if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    try {
      await deleteProduct(p._id);
      showToast('Product deleted');
      load();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const handleToggle = async (p: Product) => {
    try {
      await toggleProduct(p._id, !p.isActive);
      showToast(p.isActive ? 'Product hidden' : 'Product published');
      load();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>Products</h1>
        <div style={{ display: 'flex', gap: 10, flex: 1, maxWidth: 480, marginLeft: 'auto' }}>
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search products…"
          />
          <Link to="/admin/products/new" className="btn">+ New product</Link>
        </div>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        {loading ? (
          <p className="text-muted" style={{ padding: 20 }}>Loading…</p>
        ) : products.length === 0 ? (
          <p className="text-muted" style={{ padding: 20 }}>No products found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: 56 }}>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th style={{ textAlign: 'right' }}>Price</th>
                <th style={{ textAlign: 'right' }}>Stock</th>
                <th>Rating</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id}>
                  <td>
                    <img src={p.images[0]} alt={p.name} style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                  </td>
                  <td>
                    <div className="truncate" style={{ fontWeight: 600 }}>{p.name}</div>
                    {p.images.length > 1 && <div className="text-muted" style={{ fontSize: 11 }}>{p.images.length} images</div>}
                  </td>
                  <td>{p.category}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>
                    {p.discountPrice ? (
                      <>
                        <div>₦{p.discountPrice.toLocaleString()}</div>
                        <div className="text-muted" style={{ textDecoration: 'line-through', fontSize: 12 }}>₦{p.price.toLocaleString()}</div>
                      </>
                    ) : (
                      `₦${p.price.toLocaleString()}`
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span style={{ color: p.stock <= 10 ? 'var(--c-danger)' : 'inherit', fontWeight: p.stock <= 10 ? 700 : 400 }}>
                      {p.stock}
                    </span>
                  </td>
                  <td>{p.ratingsCount > 0 ? `${p.ratingsAverage.toFixed(1)} (${p.ratingsCount})` : '—'}</td>
                  <td>
                    <span className="badge" style={{ borderColor: p.isActive ? '#14532d' : '#991515', color: p.isActive ? '#14532d' : '#991515' }}>
                      {p.isActive ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <Link to={`/admin/products/${p._id}`} className="btn btn-outline btn-sm">Edit</Link>
                      <button className="btn btn-outline btn-sm" onClick={() => handleToggle(p)}>{p.isActive ? 'Hide' : 'Publish'}</button>
                      <button className="btn btn-outline btn-sm btn-danger" onClick={() => handleDelete(p)}>Delete</button>
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
          <span className="text-muted" style={{ alignSelf: 'center', fontSize: 14 }}>Page {page} of {pages} · {total}</span>
          <button className="btn btn-outline" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}
    </div>
  );
};