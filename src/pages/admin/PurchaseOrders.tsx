import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Plus, X, ClipboardList, PackageCheck } from 'lucide-react';
import { listBranches } from '../../api/branches.api';
import type { Branch } from '../../api/branches.api';
import { listSuppliers } from '../../api/suppliers.api';
import type { Supplier } from '../../api/suppliers.api';
import { listProducts } from '../../api/products.api';
import type { Product } from '../../api/products.api';
import { createPurchaseOrder, listPurchaseOrders, receivePurchaseOrder } from '../../api/purchase-orders.api';
import type { CreatePurchaseOrderItemInput, PurchaseOrder } from '../../api/purchase-orders.api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { getErrorMessage } from '../../utils/errorMessage';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

interface DraftLine {
  productId: string;
  variantId: string;
  quantityOrdered: string;
  costPrice: string;
}

function emptyLine(): DraftLine {
  return { productId: '', variantId: '', quantityOrdered: '', costPrice: '' };
}

const statusTone = {
  draft: 'neutral',
  ordered: 'info',
  received: 'success',
  cancelled: 'danger',
} as const;

export default function PurchaseOrders() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [receivingId, setReceivingId] = useState<string | null>(null);

  const [branchId, setBranchId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<DraftLine[]>([emptyLine()]);

  function refreshOrders() {
    setLoading(true);
    listPurchaseOrders()
      .then(setOrders)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    listBranches().then((b) => {
      setBranches(b);
      if (b.length > 0) setBranchId(b[0].id);
    });
    listSuppliers().then(setSuppliers);
    listProducts().then(setProducts);
    refreshOrders();
  }, []);

  function updateLine(index: number, field: keyof DraftLine, value: string) {
    setLines((ls) => ls.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
  }

  function addLine() {
    setLines((ls) => [...ls, emptyLine()]);
  }

  function removeLine(index: number) {
    setLines((ls) => ls.filter((_, i) => i !== index));
  }

  function variantsFor(productId: string) {
    return products.find((p) => p.id === productId)?.variants ?? [];
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const items: CreatePurchaseOrderItemInput[] = lines.map((l) => ({
        productId: l.productId,
        variantId: l.variantId || undefined,
        quantityOrdered: Number(l.quantityOrdered),
        costPrice: Number(l.costPrice),
      }));
      await createPurchaseOrder({ branchId, supplierId, notes: notes || undefined, items });
      setNotes('');
      setLines([emptyLine()]);
      refreshOrders();
    } catch (err) {
      setError(
        getErrorMessage(err, 'Failed to create purchase order. Check that all lines have a product, quantity, and cost.'),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReceive(id: string) {
    setReceivingId(id);
    try {
      await receivePurchaseOrder(id);
      refreshOrders();
    } finally {
      setReceivingId(null);
    }
  }

  const selectClass =
    'rounded-lg border border-surface-400 bg-surface-100 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-500';
  const numInputClass =
    'rounded-lg border border-surface-400 bg-surface-100 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-500';

  return (
    <div>
      <PageHeader title="Purchase Orders" description="Order and receive stock from your suppliers." />

      <Card className="mb-6">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-200">
          <ClipboardList size={16} className="text-brand-400" />
          Create purchase order
        </h2>
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Select label="Branch" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
            <Select label="Supplier" value={supplierId} onChange={(e) => setSupplierId(e.target.value)} required>
              <option value="" disabled>
                Select a supplier
              </option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
            <Input label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-zinc-400">Line items</p>
            <div className="flex flex-col gap-2">
              {lines.map((line, i) => {
                const variants = variantsFor(line.productId);
                return (
                  <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg bg-surface-200/50 p-2">
                    <select
                      value={line.productId}
                      onChange={(e) => updateLine(i, 'productId', e.target.value)}
                      required
                      className={selectClass}
                    >
                      <option value="" disabled>
                        Select product
                      </option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    {variants.length > 0 && (
                      <select
                        value={line.variantId}
                        onChange={(e) => updateLine(i, 'variantId', e.target.value)}
                        required
                        className={selectClass}
                      >
                        <option value="" disabled>
                          Select variant
                        </option>
                        {variants.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.name}
                          </option>
                        ))}
                      </select>
                    )}
                    <input
                      type="number"
                      min={0.001}
                      step="0.001"
                      placeholder="Qty"
                      value={line.quantityOrdered}
                      onChange={(e) => updateLine(i, 'quantityOrdered', e.target.value)}
                      required
                      className={`w-20 ${numInputClass}`}
                    />
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="Cost price"
                      value={line.costPrice}
                      onChange={(e) => updateLine(i, 'costPrice', e.target.value)}
                      required
                      className={`w-28 ${numInputClass}`}
                    />
                    {lines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLine(i)}
                        className="text-zinc-500 hover:text-red-400"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              onClick={addLine}
              className="mt-2 flex items-center gap-1 text-sm text-brand-400 hover:text-brand-300"
            >
              <Plus size={14} /> Add line
            </button>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div>
            <Button type="submit" disabled={submitting} icon={<Plus size={16} />}>
              {submitting ? 'Creating...' : 'Create purchase order'}
            </Button>
          </div>
        </form>
      </Card>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((po) => (
            <Card key={po.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-zinc-100">
                    {po.supplier.name} <span className="text-zinc-500">· {po.branch.name}</span>
                  </p>
                  {po.notes && <p className="text-xs text-zinc-500">{po.notes}</p>}
                </div>
                <Badge tone={statusTone[po.status]}>{po.status}</Badge>
              </div>
              <ul className="mt-3 flex flex-col gap-1 border-t border-surface-300 pt-3 text-sm text-zinc-400">
                {po.items.map((item) => (
                  <li key={item.id}>
                    {item.product.name}
                    {item.variant ? ` (${item.variant.name})` : ''} — ordered {item.quantityOrdered}, received{' '}
                    {item.quantityReceived} @ ₹{item.costPrice}
                  </li>
                ))}
              </ul>
              {po.status === 'ordered' && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-3"
                  icon={<PackageCheck size={14} />}
                  disabled={receivingId === po.id}
                  onClick={() => handleReceive(po.id)}
                >
                  {receivingId === po.id ? 'Receiving...' : 'Mark as received'}
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
