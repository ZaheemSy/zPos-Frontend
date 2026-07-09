import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { addVariant, createProduct, listProducts } from '../../api/products.api';
import type { Product } from '../../api/products.api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { getErrorMessage } from '../../utils/errorMessage';

const TAX_RATES = [0, 5, 12, 18, 28];

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [hsnCode, setHsnCode] = useState('');
  const [unit, setUnit] = useState('EA');
  const [taxPercent, setTaxPercent] = useState(18);
  const [cessPercent, setCessPercent] = useState(0);
  const [hasVariants, setHasVariants] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [variantDrafts, setVariantDrafts] = useState<Record<string, string>>({});

  function refresh() {
    setLoading(true);
    listProducts()
      .then(setProducts)
      .catch(() => setError('Failed to load products'))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await createProduct({ name, hsnCode, unit, taxPercent, cessPercent, hasVariants });
      setName('');
      setHsnCode('');
      setUnit('EA');
      setTaxPercent(18);
      setCessPercent(0);
      setHasVariants(false);
      refresh();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to create product'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddVariant(productId: string) {
    const variantName = variantDrafts[productId]?.trim();
    if (!variantName) return;
    await addVariant(productId, variantName);
    setVariantDrafts((d) => ({ ...d, [productId]: '' }));
    refresh();
  }

  return (
    <section style={{ maxWidth: 720, margin: '40px auto' }}>
      <p>
        <Link to="/admin">&larr; Dashboard</Link>
      </p>
      <h1>Products</h1>

      <form onSubmit={handleCreate} style={{ marginBottom: 32, border: '1px solid #444', padding: 16 }}>
        <h2>Add product</h2>
        <div>
          <label>
            Name
            <br />
            <input id="product-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
        </div>
        <div style={{ marginTop: 8 }}>
          <label>
            HSN code
            <br />
            <input id="product-hsn" value={hsnCode} onChange={(e) => setHsnCode(e.target.value)} required />
          </label>
        </div>
        <div style={{ marginTop: 8 }}>
          <label>
            Unit
            <br />
            <input id="product-unit" value={unit} onChange={(e) => setUnit(e.target.value)} required />
          </label>
        </div>
        <div style={{ marginTop: 8 }}>
          <label>
            Tax %
            <br />
            <select value={taxPercent} onChange={(e) => setTaxPercent(Number(e.target.value))}>
              {TAX_RATES.map((rate) => (
                <option key={rate} value={rate}>
                  {rate}%
                </option>
              ))}
            </select>
          </label>
        </div>
        <div style={{ marginTop: 8 }}>
          <label>
            Cess %
            <br />
            <input
              type="number"
              min={0}
              step="0.01"
              value={cessPercent}
              onChange={(e) => setCessPercent(Number(e.target.value))}
            />
          </label>
        </div>
        <div style={{ marginTop: 8 }}>
          <label>
            <input type="checkbox" checked={hasVariants} onChange={(e) => setHasVariants(e.target.checked)} />
            {' Has variants'}
          </label>
        </div>
        {error && (
          <p role="alert" style={{ color: 'red' }}>
            {error}
          </p>
        )}
        <button type="submit" disabled={submitting} style={{ marginTop: 12 }}>
          {submitting ? 'Saving...' : 'Add product'}
        </button>
      </form>

      <h2>All products</h2>
      {loading ? (
        <LoadingSpinner />
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {products.map((p) => (
            <li key={p.id} style={{ border: '1px solid #333', padding: 12, marginBottom: 8 }}>
              <strong>{p.name}</strong> — HSN {p.hsnCode} — {p.unit} — GST {p.taxPercent}%
              {Number(p.cessPercent) > 0 && ` + Cess ${p.cessPercent}%`}
              {p.hasVariants && (
                <div style={{ marginTop: 8 }}>
                  <div>
                    Variants:{' '}
                    {p.variants.length === 0 ? '(none yet)' : p.variants.map((v) => v.name).join(', ')}
                  </div>
                  <input
                    placeholder="New variant name"
                    value={variantDrafts[p.id] ?? ''}
                    onChange={(e) => setVariantDrafts((d) => ({ ...d, [p.id]: e.target.value }))}
                  />
                  <button type="button" onClick={() => handleAddVariant(p.id)}>
                    Add variant
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
