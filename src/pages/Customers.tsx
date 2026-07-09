import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Search, Plus, UserPlus, ChevronDown, ChevronRight, Coins } from 'lucide-react';
import { createCustomer, getCustomerHistory, listCustomers } from '../api/customers.api';
import type { Customer, CustomerHistory } from '../api/customers.api';
import LoadingSpinner from '../components/LoadingSpinner';
import { getErrorMessage } from '../utils/errorMessage';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

export default function Customers() {
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
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to create customer'));
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
    <div>
      <PageHeader title="Customers" description="Search, add, and view loyalty & purchase history." />

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Card>
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-200">
            <UserPlus size={16} className="text-brand-400" />
            Add customer
          </h2>
          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            <Input id="customer-name" label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input id="customer-phone" label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button type="submit" disabled={submitting} icon={<Plus size={16} />} className="self-start">
              {submitting ? 'Saving...' : 'Add customer'}
            </Button>
          </form>
        </Card>

        <Card>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={15} />
              <input
                placeholder="Search by name or phone"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-surface-400 bg-surface-100 py-2 pl-9 pr-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <Button type="submit" variant="secondary">
              Search
            </Button>
          </form>

          <div className="mt-4 max-h-96 overflow-y-auto">
            {loading ? (
              <LoadingSpinner />
            ) : customers.length === 0 ? (
              <p className="py-6 text-center text-sm text-zinc-500">No customers found.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {customers.map((c) => (
                  <div key={c.id} className="rounded-lg border border-surface-300">
                    <button
                      onClick={() => handleSelect(c.id)}
                      className="flex w-full items-center justify-between gap-2 p-3 text-left hover:bg-surface-200/60"
                    >
                      <div>
                        <p className="font-medium text-zinc-100">{c.name}</p>
                        <p className="text-xs text-zinc-500">{c.phone ?? 'No phone'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge tone="info">
                          <Coins size={11} className="mr-1 inline" />
                          {c.loyaltyPoints} pts
                        </Badge>
                        {Number(c.totalDue) > 0 && <Badge tone="warning">Due ₹{c.totalDue}</Badge>}
                        {selectedId === c.id ? (
                          <ChevronDown size={15} className="text-zinc-500" />
                        ) : (
                          <ChevronRight size={15} className="text-zinc-500" />
                        )}
                      </div>
                    </button>
                    {selectedId === c.id && history && (
                      <div className="border-t border-surface-300 bg-surface-200/40 px-3 py-2 text-xs text-zinc-400">
                        <p>Purchases: {history.sales.length === 0 ? 'none yet' : history.sales.length}</p>
                        <p>Loyalty transactions: {history.loyaltyTransactions.length}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
