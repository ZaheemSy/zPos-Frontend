import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listHeldSales, resumeSale } from '../../api/sales.api';
import type { Sale } from '../../api/sales.api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { getErrorMessage } from '../../utils/errorMessage';

export default function HoldSales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [resumingId, setResumingId] = useState<string | null>(null);
  const [paymentMode, setPaymentMode] = useState<'cash' | 'card' | 'upi'>('cash');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    setLoading(true);
    listHeldSales()
      .then(setSales)
      .finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  function startResume(sale: Sale) {
    setResumingId(sale.id);
    setAmount(sale.total);
    setError(null);
  }

  async function confirmResume(id: string) {
    setError(null);
    try {
      await resumeSale(id, [{ paymentMode, amount: Number(amount) }]);
      setResumingId(null);
      refresh();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to resume sale — check stock is still available.'));
    }
  }

  return (
    <section style={{ maxWidth: 640, margin: '40px auto' }}>
      <p>
        <Link to="/cashier">&larr; Billing</Link>
      </p>
      <h1>Held Sales</h1>

      {loading ? (
        <LoadingSpinner />
      ) : sales.length === 0 ? (
        <p>No held sales.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {sales.map((sale) => (
            <li key={sale.id} style={{ border: '1px solid #333', padding: 12, marginBottom: 8 }}>
              <div>
                {sale.customer?.name ?? 'Walk-in'} — {sale.items.length} item(s) — total ₹{sale.total}
              </div>
              {resumingId === sale.id ? (
                <div style={{ marginTop: 8 }}>
                  <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value as typeof paymentMode)}>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="upi">UPI</option>
                  </select>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    style={{ width: 100, marginLeft: 8 }}
                  />
                  <button type="button" onClick={() => confirmResume(sale.id)} style={{ marginLeft: 8 }}>
                    Confirm
                  </button>
                  <button type="button" onClick={() => setResumingId(null)} style={{ marginLeft: 4 }}>
                    Cancel
                  </button>
                  {error && (
                    <p role="alert" style={{ color: 'red' }}>
                      {error}
                    </p>
                  )}
                </div>
              ) : (
                <button type="button" onClick={() => startResume(sale)} style={{ marginTop: 8 }}>
                  Resume
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
