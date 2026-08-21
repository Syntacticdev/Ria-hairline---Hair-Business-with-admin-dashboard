import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getAllProducts, createProduct, updateProduct } from '../api';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../api';

const MAX_IMAGES = 4;

const empty = {
  name: '',
  description: '',
  price: '',
  discountPrice: '',
  category: '',
  brand: '',
  unit: '1 piece',
  stock: '10',
  sizes: '',
};

export const ProductForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [form, setForm] = useState(empty);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [removeList, setRemoveList] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (!id) return;
    getAllProducts({ limit: 1000 })
      .then((data) => {
        const product = data.products.find((p) => p._id === id);
        if (product) {
          setForm({
            name: product.name,
            description: product.description,
            price: String(product.price),
            discountPrice: product.discountPrice ? String(product.discountPrice) : '',
            category: product.category,
            brand: product.brand ?? '',
            unit: product.unit ?? '',
            stock: String(product.stock),
            sizes: (product.sizes ?? []).join(', '),
          });
          setIsFeatured(product.isFeatured);
          setIsActive(product.isActive);
          setExistingImages(product.images);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const setField = (key: keyof typeof empty, value: string) => setForm({ ...form, [key]: value });

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const total = existingImages.length - removeList.length + newFiles.length + files.length;
    if (total > MAX_IMAGES) {
      showToast(`A product can have at most ${MAX_IMAGES} images.`, 'error');
      return;
    }
    const picked = Array.from(files).slice(0, MAX_IMAGES - (existingImages.length - removeList.length + newFiles.length));
    setNewFiles((prev) => [...prev, ...picked]);
    setNewPreviews((prev) => [...prev, ...picked.map((f) => URL.createObjectURL(f))]);
  };

  const removeImage = (url: string) => {
    setExistingImages((prev) => prev.filter((u) => u !== url));
    setRemoveList((prev) => [...prev, url]);
  };

  const dropNewFile = (i: number) => {
    setNewFiles((prev) => prev.filter((_, idx) => idx !== i));
    setNewPreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = new FormData();
      data.append('name', form.name);
      data.append('description', form.description);
      data.append('price', form.price);
      data.append('category', form.category);
      data.append('stock', form.stock);
      data.append('isFeatured', String(isFeatured));
      data.append('isActive', String(isActive));
      if (form.discountPrice) data.append('discountPrice', form.discountPrice);
      if (form.brand) data.append('brand', form.brand);
      if (form.unit) data.append('unit', form.unit);
      if (form.sizes.trim()) {
        form.sizes.split(',').map((s) => s.trim()).filter(Boolean).forEach((s) => data.append('sizes[]', s));
      }
      newFiles.forEach((f) => data.append('images', f));
      if (isEdit) {
        if (removeList.length > 0) data.append('removeImages', JSON.stringify(removeList));
        await updateProduct(id!, data);
        showToast('Product updated');
      } else {
        await createProduct(data);
        showToast('Product created');
      }
      navigate('/admin/products');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-muted">Loading…</p>;

  const currentCount = existingImages.length + newFiles.length;
  const canAdd = currentCount < MAX_IMAGES;

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ marginBottom: 20 }}>
        <Link to="/admin/products" className="text-muted" style={{ fontSize: 13 }}>← Back to products</Link>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>{isEdit ? 'Edit product' : 'New product'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="card" style={{ padding: 24, display: 'grid', gap: 16 }}>
        <div className="admin-form-2">
          <div style={{ gridColumn: '1 / -1' }}>
            <label>Product name</label>
            <input required value={form.name} onChange={(e) => setField('name', e.target.value)} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label>Description</label>
            <textarea required rows={4} value={form.description} onChange={(e) => setField('description', e.target.value)} />
          </div>
          <div>
            <label>Price (₦)</label>
            <input required type="number" min={0} step="0.01" value={form.price} onChange={(e) => setField('price', e.target.value)} />
          </div>
          <div>
            <label>Discount price (₦)</label>
            <input type="number" min={0} step="0.01" value={form.discountPrice} onChange={(e) => setField('discountPrice', e.target.value)} />
          </div>
          <div>
            <label>Category</label>
            <input required value={form.category} onChange={(e) => setField('category', e.target.value)} placeholder="e.g. Human Hair, Wigs" />
          </div>
          <div>
            <label>Brand</label>
            <input value={form.brand} onChange={(e) => setField('brand', e.target.value)} />
          </div>
          <div>
            <label>Stock</label>
            <input required type="number" min={0} value={form.stock} onChange={(e) => setField('stock', e.target.value)} />
          </div>
          <div>
            <label>Unit</label>
            <input value={form.unit} onChange={(e) => setField('unit', e.target.value)} placeholder="e.g. 1 piece, pack of 2" />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label>Sizes (comma separated, optional)</label>
            <input value={form.sizes} onChange={(e) => setField('sizes', e.target.value)} placeholder="e.g. Small, Medium, Large" />
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, textTransform: 'none', fontSize: 14 }}>
              <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} style={{ width: 'auto' }} />
              Featured
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, textTransform: 'none', fontSize: 14 }}>
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} style={{ width: 'auto' }} />
              Active (visible in store)
            </label>
          </div>
        </div>

        <div>
          <label>Images ({currentCount}/{MAX_IMAGES})</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 10 }}>
            {existingImages.map((url) => (
              <div key={url} style={{ position: 'relative', border: '1px solid var(--c-border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                <img src={url} alt="Product" style={{ width: '100%', height: 110, objectFit: 'cover' }} />
                <button
                  type="button"
                  onClick={() => removeImage(url)}
                  style={{ position: 'absolute', top: 4, right: 4, background: '#000', color: '#fff', border: 0, borderRadius: 999, width: 22, height: 22, fontSize: 13, lineHeight: 1 }}
                  aria-label="Remove image"
                >
                  ×
                </button>
              </div>
            ))}
            {newPreviews.map((url, i) => (
              <div key={url} style={{ position: 'relative', border: '1px solid var(--c-border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                <img src={url} alt="New upload" style={{ width: '100%', height: 110, objectFit: 'cover' }} />
                <button
                  type="button"
                  onClick={() => dropNewFile(i)}
                  style={{ position: 'absolute', top: 4, right: 4, background: '#000', color: '#fff', border: 0, borderRadius: 999, width: 22, height: 22, fontSize: 13, lineHeight: 1 }}
                  aria-label="Remove upload"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          {canAdd && (
            <label className="btn btn-outline" style={{ marginTop: 12, cursor: 'pointer' }}>
              Upload images (up to {MAX_IMAGES})
              <input type="file" accept="image/*" multiple hidden onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }} />
            </label>
          )}
          <p className="text-muted" style={{ fontSize: 12, marginTop: 6 }}>
            Add up to {MAX_IMAGES} images to show the product from multiple angles.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn" disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create product'}</button>
          <Link to="/admin/products" className="btn btn-outline">Cancel</Link>
        </div>
      </form>
    </div>
  );
};