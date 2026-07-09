import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { createCoupon, listCoupons } from '../../api/coupons.api';
import type { Coupon } from '../../api/coupons.api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { getErrorMessage } from '../../utils/errorMessage';

function isExpired(coupon: Coupon) {
  return new Date(coupon.validUntil) < new Date();
}

export default function Coupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [discountValue, setDiscountValue] = useState('');
  const [minOrderValue, setMinOrderValue] = useState('0');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');

  function refresh() {
    setLoading(true);
    listCoupons()
      .then(setCoupons)
      .catch(() => setError('Failed to load coupons'))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await createCoupon({
        code,
        discountType,
        discountValue: Number(discountValue),
        minOrderValue: Number(minOrderValue),
        validFrom,
        validUntil,
      });
      setCode('');
      setDiscountValue('');
      setMinOrderValue('0');
      setValidFrom('');
      setValidUntil('');
      refresh();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to create coupon'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section style={{ maxWidth: 640, margin: '40px auto' }}>
      <p>
        <Link to="/admin">&larr; Dashboard</Link>
      </p>
      <h1>Coupons</h1>

      <form onSubmit={handleCreate} style={{ marginBottom: 32, border: '1px solid #444', padding: 16 }}>
        <h2>Add coupon</h2>
        <div>
          <label>
            Code
            <br />
            <input id="coupon-code" value={code} onChange={(e) => setCode(e.target.value)} required />
          </label>
        </div>
        <div style={{ marginTop: 8 }}>
          <label>
            Discount type
            <br />
            <select value={discountType} onChange={(e) => setDiscountType(e.target.value as 'percent' | 'fixed')}>
              <option value="percent">Percent</option>
              <option value="fixed">Fixed amount</option>
            </select>
          </label>
        </div>
        <div style={{ marginTop: 8 }}>
          <label>
            Discount value
            <br />
            <input
              id="coupon-discount-value"
              type="number"
              min={0}
              step="0.01"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              required
            />
          </label>
        </div>
        <div style={{ marginTop: 8 }}>
          <label>
            Min order value
            <br />
            <input
              type="number"
              min={0}
              step="0.01"
              value={minOrderValue}
              onChange={(e) => setMinOrderValue(e.target.value)}
            />
          </label>
        </div>
        <div style={{ marginTop: 8 }}>
          <label>
            Valid from
            <br />
            <input id="coupon-valid-from" type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} required />
          </label>
        </div>
        <div style={{ marginTop: 8 }}>
          <label>
            Valid until
            <br />
            <input id="coupon-valid-until" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} required />
          </label>
        </div>
        {error && (
          <p role="alert" style={{ color: 'red' }}>
            {error}
          </p>
        )}
        <button type="submit" disabled={submitting} style={{ marginTop: 12 }}>
          {submitting ? 'Saving...' : 'Add coupon'}
        </button>
      </form>

      <h2>All coupons</h2>
      {loading ? (
        <LoadingSpinner />
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {coupons.map((c) => (
            <li key={c.id} style={{ border: '1px solid #333', padding: 12, marginBottom: 8 }}>
              <strong>{c.code}</strong> —{' '}
              {c.discountType === 'percent' ? `${c.discountValue}% off` : `₹${c.discountValue} off`}
              {Number(c.minOrderValue) > 0 && ` (min order ₹${c.minOrderValue})`} —{' '}
              <span style={{ color: isExpired(c) ? 'red' : 'lightgreen' }}>
                {isExpired(c) ? 'expired' : 'active'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
