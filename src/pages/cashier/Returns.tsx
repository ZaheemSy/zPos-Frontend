import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { findSalesByInvoiceNumber, processReturn } from '../../api/sales.api';
import type { Sale } from '../../api/sales.api';
import { getErrorMessage } from '../../utils/errorMessage';

export default function Returns() {
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [sale, setSale] = useState<Sale | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [searching, setSearching] = useState(false);

  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [refundMode, setRefundMode] = useState<'cash' | 'upi' | 'credit_to_account'>('cash');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    setSuccess(null);
    setError(null);
    setSearching(true);
    try {
      const results = await findSalesByInvoiceNumber(invoiceNumber);
      const match = results.find((s) => s.invoiceNumber.toLowerCase() === invoiceNumber.trim().toLowerCase()) ?? results[0];
      if (!match) {
        setSale(null);
        setNotFound(true);
      } else {
        setSale(match);
        setNotFound(false);
        const defaults: Record<string, string> = {};
        match.items.forEach((item) => (defaults[item.id] = '0'));
        setQuantities(defaults);
      }
    } finally {
      setSearching(false);
    }
  }

  async function handleSubmitReturn() {
    if (!sale) return;
    setError(null);
    setSuccess(null);
    const items = Object.entries(quantities)
      .filter(([, qty]) => Number(qty) > 0)
      .map(([saleItemId, qty]) => ({ saleItemId, quantityReturned: Number(qty) }));

    if (items.length === 0) {
      setError('Enter a quantity to return for at least one item.');
      return;
    }

    setSubmitting(true);
    try {
      await processReturn(sale.id, { refundMode, reason: reason || undefined, items });
      setSuccess('Return processed and stock restored.');
      setSale(null);
      setInvoiceNumber('');
      setQuantities({});
      setReason('');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to process return.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section style={{ maxWidth: 640, margin: '40px auto' }}>
      <p>
        <Link to="/cashier">&larr; Billing</Link>
      </p>
      <h1>Returns</h1>

      <form onSubmit={handleSearch}>
        <input
          placeholder="Enter invoice number (e.g. INV9)"
          value={invoiceNumber}
          onChange={(e) => setInvoiceNumber(e.target.value)}
          style={{ width: 260 }}
          required
        />
        <button type="submit" disabled={searching}>
          {searching ? 'Searching...' : 'Search'}
        </button>
      </form>

      {notFound && <p style={{ color: 'red' }}>No sale found with that invoice number.</p>}
      {success && <p style={{ color: 'lightgreen' }}>{success}</p>}

      {sale && (
        <div style={{ marginTop: 16, border: '1px solid #444', padding: 16 }}>
          <div>
            Invoice: <strong>{sale.invoiceNumber}</strong> — status: {sale.status} — total: ₹{sale.total}
          </div>
          <div>{sale.customer?.name ?? 'Walk-in'}</div>

          <table style={{ width: '100%', marginTop: 12 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Item</th>
                <th>Sold Qty</th>
                <th>Return Qty</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.itemDescription}</td>
                  <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="number"
                      min={0}
                      max={Number(item.quantity)}
                      style={{ width: 60 }}
                      value={quantities[item.id] ?? '0'}
                      onChange={(e) => setQuantities((q) => ({ ...q, [item.id]: e.target.value }))}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: 12 }}>
            <label>
              Refund method:{' '}
              <select value={refundMode} onChange={(e) => setRefundMode(e.target.value as typeof refundMode)}>
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="credit_to_account">Credit to account</option>
              </select>
            </label>
          </div>
          <div style={{ marginTop: 8 }}>
            <input
              placeholder="Reason (optional)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          {error && (
            <p role="alert" style={{ color: 'red' }}>
              {error}
            </p>
          )}

          <button type="button" disabled={submitting} onClick={handleSubmitReturn} style={{ marginTop: 12 }}>
            {submitting ? 'Processing...' : 'Process Return'}
          </button>
        </div>
      )}
    </section>
  );
}
