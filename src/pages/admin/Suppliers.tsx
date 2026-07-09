import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Plus, Truck } from 'lucide-react';
import { createSupplier, listSuppliers } from '../../api/suppliers.api';
import type { Supplier } from '../../api/suppliers.api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { getErrorMessage } from '../../utils/errorMessage';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Table, THead, TBody, Tr, Th, Td } from '../../components/ui/Table';

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
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to create supplier'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader title="Suppliers" description="Manage your vendor directory." />

      <Card className="mb-6">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-200">
          <Truck size={16} className="text-brand-400" />
          Add supplier
        </h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Input id="supplier-name" label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input id="supplier-phone" label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Input id="supplier-gstin" label="GSTIN" value={gstin} onChange={(e) => setGstin(e.target.value)} />

          {error && (
            <p role="alert" className="col-span-full text-sm text-red-400">
              {error}
            </p>
          )}

          <div className="col-span-full">
            <Button type="submit" disabled={submitting} icon={<Plus size={16} />}>
              {submitting ? 'Saving...' : 'Add supplier'}
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
              <Th>Name</Th>
              <Th>Phone</Th>
              <Th>GSTIN</Th>
            </tr>
          </THead>
          <TBody>
            {suppliers.map((s) => (
              <Tr key={s.id}>
                <Td className="font-medium text-zinc-100">{s.name}</Td>
                <Td>{s.phone ?? '—'}</Td>
                <Td>{s.gstin ?? '—'}</Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}
