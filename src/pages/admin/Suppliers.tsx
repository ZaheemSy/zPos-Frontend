import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { createSupplier, listSuppliers } from '../../api/suppliers.api';
import type { Supplier } from '../../api/suppliers.api';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gstin, setGstin] = useState('');

  function refresh() {
    setLoading(true);
    listSuppliers()
      .then(setSuppliers)
      .catch(() => setError('Failed to load suppliers'))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await createSupplier({ name, phone: phone || undefined, gstin: gstin || undefined });
      setName('');
      setPhone('');
      setGstin('');
      refresh();
    } catch {
      setError('Failed to create supplier');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section style={{ maxWidth: 640, margin: '40px auto' }}>
      <p>
        <Link to="/admin">&larr; Dashboard</Link>
      </p>
      <h1>Suppliers</h1>

      <form onSubmit={handleCreate} style={{ marginBottom: 32, border: '1px solid #444', padding: 16 }}>
        <h2>Add supplier</h2>
        <div>
          <label>
            Name
            <br />
            <input id="supplier-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
        </div>
        <div style={{ marginTop: 8 }}>
          <label>
            Phone
            <br />
            <input id="supplier-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
        </div>
        <div style={{ marginTop: 8 }}>
          <label>
            GSTIN
            <br />
            <input id="supplier-gstin" value={gstin} onChange={(e) => setGstin(e.target.value)} />
          </label>
        </div>
        {error && (
          <p role="alert" style={{ color: 'red' }}>
            {error}
          </p>
        )}
        <button type="submit" disabled={submitting} style={{ marginTop: 12 }}>
          {submitting ? 'Saving...' : 'Add supplier'}
        </button>
      </form>

      <h2>All suppliers</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {suppliers.map((s) => (
            <li key={s.id} style={{ border: '1px solid #333', padding: 12, marginBottom: 8 }}>
              <strong>{s.name}</strong>
              {s.phone && ` — ${s.phone}`}
              {s.gstin && ` — GSTIN ${s.gstin}`}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
