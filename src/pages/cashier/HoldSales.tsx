import { useEffect, useState } from 'react';
import { PauseCircle, PlayCircle } from 'lucide-react';
import { listHeldSales, resumeSale } from '../../api/sales.api';
import type { Sale } from '../../api/sales.api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { getErrorMessage } from '../../utils/errorMessage';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

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
    <div>
      <PageHeader title="Held Sales" description="Resume a parked cart and take payment." />

      {loading ? (
        <LoadingSpinner />
      ) : sales.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-12 text-zinc-500">
          <PauseCircle size={28} />
          <p className="text-sm">No held sales.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {sales.map((sale) => (
            <Card key={sale.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-zinc-100">{sale.customer?.name ?? 'Walk-in'}</p>
                  <p className="text-xs text-zinc-500">
                    {sale.items.length} item(s) — total ₹{sale.total}
                  </p>
                </div>
                {resumingId !== sale.id && (
                  <Button size="sm" icon={<PlayCircle size={14} />} onClick={() => startResume(sale)}>
                    Resume
                  </Button>
                )}
              </div>

              {resumingId === sale.id && (
                <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-surface-300 pt-3">
                  <Select
                    label="Payment mode"
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as typeof paymentMode)}
                    className="w-32"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="upi">UPI</option>
                  </Select>
                  <Input
                    label="Amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-32"
                  />
                  <Button size="sm" onClick={() => confirmResume(sale.id)}>
                    Confirm
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setResumingId(null)}>
                    Cancel
                  </Button>
                  {error && <p className="w-full text-sm text-red-400">{error}</p>}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
