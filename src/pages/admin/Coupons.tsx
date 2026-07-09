import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Plus, Tag } from 'lucide-react';
import { createCoupon, listCoupons } from '../../api/coupons.api';
import type { Coupon } from '../../api/coupons.api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { getErrorMessage } from '../../utils/errorMessage';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Table, THead, TBody, Tr, Th, Td } from '../../components/ui/Table';

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
    <div>
      <PageHeader title="Coupons" description="Create and manage discount codes." />

      <Card className="mb-6">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-200">
          <Tag size={16} className="text-brand-400" />
          Add coupon
        </h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <Input id="coupon-code" label="Code" value={code} onChange={(e) => setCode(e.target.value)} required />
          <Select label="Discount type" value={discountType} onChange={(e) => setDiscountType(e.target.value as 'percent' | 'fixed')}>
            <option value="percent">Percent</option>
            <option value="fixed">Fixed amount</option>
          </Select>
          <Input
            id="coupon-discount-value"
            label="Discount value"
            type="number"
            min={0}
            step="0.01"
            value={discountValue}
            onChange={(e) => setDiscountValue(e.target.value)}
            required
          />
          <Input
            label="Min order value"
            type="number"
            min={0}
            step="0.01"
            value={minOrderValue}
            onChange={(e) => setMinOrderValue(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input id="coupon-valid-from" label="Valid from" type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} required />
            <Input id="coupon-valid-until" label="Valid until" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} required />
          </div>

          {error && (
            <p role="alert" className="col-span-full text-sm text-red-400">
              {error}
            </p>
          )}

          <div className="col-span-full">
            <Button type="submit" disabled={submitting} icon={<Plus size={16} />}>
              {submitting ? 'Saving...' : 'Add coupon'}
            </Button>
          </div>
        </form>
      </Card>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <Table>
          <THead>
            <tr>
              <Th>Code</Th>
              <Th>Discount</Th>
              <Th>Min order</Th>
              <Th>Status</Th>
            </tr>
          </THead>
          <TBody>
            {coupons.map((c) => (
              <Tr key={c.id}>
                <Td className="font-medium text-zinc-100">{c.code}</Td>
                <Td>{c.discountType === 'percent' ? `${c.discountValue}% off` : `₹${c.discountValue} off`}</Td>
                <Td>{Number(c.minOrderValue) > 0 ? `₹${c.minOrderValue}` : '—'}</Td>
                <Td>
                  <Badge tone={isExpired(c) ? 'danger' : 'success'}>{isExpired(c) ? 'Expired' : 'Active'}</Badge>
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}
