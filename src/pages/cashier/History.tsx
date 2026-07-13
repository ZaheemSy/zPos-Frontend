import { useEffect, useMemo, useState } from 'react';
import { Printer, History as HistoryIcon, Search, X } from 'lucide-react';
import { listSales } from '../../api/sales.api';
import type { Sale } from '../../api/sales.api';
import LoadingSpinner from '../../components/LoadingSpinner';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Table, THead, TBody, Tr, Th, Td } from '../../components/ui/Table';

const STATUS_TONE = {
  completed: 'success',
  returned: 'danger',
  partially_returned: 'warning',
  held: 'neutral',
  cancelled: 'neutral',
} as const;

export default function History() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    setLoading(true);
    listSales()
      .then((rows) => setSales(rows.filter((s) => s.status !== 'held').sort((a, b) => b.createdAt.localeCompare(a.createdAt))))
      .catch(() => setError('Failed to load invoice history'))
      .finally(() => setLoading(false));
  }, []);

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      if (invoiceSearch.trim() && !sale.invoiceNumber.toLowerCase().includes(invoiceSearch.trim().toLowerCase())) {
        return false;
      }
      const saleDate = sale.createdAt.slice(0, 10);
      if (fromDate && saleDate < fromDate) return false;
      if (toDate && saleDate > toDate) return false;
      return true;
    });
  }, [sales, invoiceSearch, fromDate, toDate]);

  function clearFilters() {
    setInvoiceSearch('');
    setFromDate('');
    setToDate('');
  }

  const hasFilters = invoiceSearch.trim() !== '' || fromDate !== '' || toDate !== '';

  return (
    <div>
      <PageHeader title="History" description="Past invoices for your branch -- open any of them again to reprint." />

      <Card className="mb-6">
        <div className="flex flex-wrap items-end gap-3">
          <Input
            label="Invoice number"
            value={invoiceSearch}
            onChange={(e) => setInvoiceSearch(e.target.value)}
            placeholder="e.g. ZPS16"
            trailing={<Search size={14} className="text-zinc-500" />}
            className="w-44"
          />
          <Input label="From date" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-40" />
          <Input label="To date" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-40" />
          {hasFilters && (
            <Button variant="ghost" size="sm" icon={<X size={14} />} onClick={clearFilters}>
              Clear
            </Button>
          )}
        </div>
      </Card>

      {error && (
        <p role="alert" className="mb-3 text-sm text-red-400">
          {error}
        </p>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : filteredSales.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-12 text-zinc-500">
          <HistoryIcon size={28} />
          <p className="text-sm">{hasFilters ? 'No invoices match your filters.' : 'No past invoices yet.'}</p>
        </Card>
      ) : (
        <Table>
          <THead>
            <tr>
              <Th>Invoice</Th>
              <Th>Date</Th>
              <Th>Customer</Th>
              <Th>Total</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </THead>
          <TBody>
            {filteredSales.map((sale) => (
              <Tr key={sale.id}>
                <Td className="font-medium text-zinc-100">{sale.invoiceNumber}</Td>
                <Td>{new Date(sale.createdAt).toLocaleString()}</Td>
                <Td>{sale.customer?.name ?? 'Walk-in'}</Td>
                <Td>₹{sale.total}</Td>
                <Td>
                  <Badge tone={STATUS_TONE[sale.status]}>{sale.status.replace('_', ' ')}</Badge>
                </Td>
                <Td>
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<Printer size={13} />}
                    onClick={() => window.open(`/invoice/${sale.id}`, '_blank')}
                  >
                    Open / Print
                  </Button>
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}
