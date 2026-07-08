import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { createCustomer, getCustomerHistory, listCustomers } from '../api/customers.api';
import type { Customer, CustomerHistory } from '../api/customers.api';
import { useAuthStore } from '../store/auth.store';

export default function Customers() {
  const role = useAuthStore((s) => s.user?.role);
  const homePath = role === 'admin' ? '/admin' : '/cashier';

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [history, setHistory] = useState<CustomerHistory | null>(null);

  function refresh(query?: string) {
    setLoading(true);
    listCustomers(query)
      .then(setCustomers)
      .catch(() => setError('Failed to load customers'))
      .finally(() => setLoading(false));
  }

  useEffect(() => refresh(), []);

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    refresh(search || undefined);
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await createCustomer({ name, phone: phone || undefined });
      setName('');
      setPhone('');
      refresh(search || undefined);
    } catch {
      setError('Failed to create customer');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSelect(id: string) {
    if (selectedId === id) {
      setSelectedId(null);
      setHistory(null);
      return;
    }
    setSelectedId(id);
    setHistory(await getCustomerHistory(id));
  }

  return (
    <section style={{ maxWidth: 640, margin: '40px auto' }}>
      <p>
        <Link to={homePath}>&larr; Dashboard</Link>
      </p>
      <h1>Customers</h1>

      <form onSubmit={handleSearch} style={{ marginBottom: 16 }}>
        <input
          placeholder="Search by name or phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 260 }}
        />
        <button type="submit">Search</button>
      </form>

      <form onSubmit={handleCreate} style={{ marginBottom: 32, border: '1px solid #444', padding: 16 }}>
        <h2>Add customer</h2>
        <div>
          <label>
            Name
            <br />
            <input id="customer-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
        </div>
        <div style={{ marginTop: 8 }}>
          <label>
            Phone
            <br />
            <input id="customer-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
        </div>
        {error && (
          <p role="alert" style={{ color: 'red' }}>
            {error}
          </p>
        )}
        <button type="submit" disabled={submitting} style={{ marginTop: 12 }}>
          {submitting ? 'Saving...' : 'Add customer'}
        </button>
      </form>

      <h2>All customers</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {customers.map((c) => (
            <li key={c.id} style={{ border: '1px solid #333', padding: 12, marginBottom: 8 }}>
              <div style={{ cursor: 'pointer' }} onClick={() => handleSelect(c.id)}>
                <strong>{c.name}</strong>
                {c.phone && ` — ${c.phone}`} — loyalty: {c.loyaltyPoints} pts
                {Number(c.totalDue) > 0 && <span style={{ color: 'orange' }}> — due: ₹{c.totalDue}</span>}
              </div>
              {selectedId === c.id && history && (
                <div style={{ marginTop: 8, fontSize: 14 }}>
                  <div>Purchases: {history.sales.length === 0 ? 'none yet' : history.sales.length}</div>
                  <div>Loyalty transactions: {history.loyaltyTransactions.length}</div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
