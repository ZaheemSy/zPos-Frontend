import { useState } from 'react';
import type { FormEvent } from 'react';
import { Search, Undo2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { findSalesByInvoiceNumber, processReturn } from '../../api/sales.api';
import type { Sale } from '../../api/sales.api';
import { getErrorMessage } from '../../utils/errorMessage';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Table, THead, TBody, Tr, Th, Td } from '../../components/ui/Table';

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
    <div>
      <PageHeader title="Returns" description="Look up an invoice and process a return." />

      <Card className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={15} />
            <input
              placeholder="Enter invoice number (e.g. INV9)"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              required
              className="w-full rounded-lg border border-surface-400 bg-surface-100 py-2 pl-9 pr-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <Button type="submit" disabled={searching}>
            {searching ? 'Searching...' : 'Search'}
          </Button>
        </form>

        {notFound && (
          <div className="mt-3 flex items-center gap-2 text-sm text-red-400">
            <AlertCircle size={15} /> No sale found with that invoice number.
          </div>
        )}
        {success && (
          <div className="mt-3 flex items-center gap-2 text-sm text-emerald-400">
            <CheckCircle2 size={15} /> {success}
          </div>
        )}
      </Card>

      {sale && (
        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-medium text-zinc-100">
                Invoice <span className="text-brand-400">{sale.invoiceNumber}</span>
              </p>
              <p className="text-xs text-zinc-500">{sale.customer?.name ?? 'Walk-in'} — total ₹{sale.total}</p>
            </div>
            <Badge tone="neutral">{sale.status}</Badge>
          </div>

          <Table>
            <THead>
              <tr>
                <Th>Item</Th>
                <Th>Sold Qty</Th>
                <Th>Return Qty</Th>
              </tr>
            </THead>
            <TBody>
              {sale.items.map((item) => (
                <Tr key={item.id}>
                  <Td className="font-medium text-zinc-100">{item.itemDescription}</Td>
                  <Td>{item.quantity}</Td>
                  <Td>
                    <input
                      type="number"
                      min={0}
                      max={Number(item.quantity)}
                      value={quantities[item.id] ?? '0'}
                      onChange={(e) => setQuantities((q) => ({ ...q, [item.id]: e.target.value }))}
                      className="w-16 rounded-md border border-surface-400 bg-surface-100 px-2 py-1 text-sm text-zinc-100"
                    />
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select
              label="Refund method"
              value={refundMode}
              onChange={(e) => setRefundMode(e.target.value as typeof refundMode)}
            >
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="credit_to_account">Credit to account</option>
            </Select>
            <Input label="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>

          {error && (
            <div role="alert" className="mt-3 flex items-start gap-2 text-sm text-red-400">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <Button className="mt-4" disabled={submitting} onClick={handleSubmitReturn} icon={<Undo2 size={16} />}>
            {submitting ? 'Processing...' : 'Process Return'}
          </Button>
        </Card>
      )}
    </div>
  );
}
