import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { listBranches } from '../../api/branches.api';
import type { Branch } from '../../api/branches.api';
import { listSuppliers } from '../../api/suppliers.api';
import type { Supplier } from '../../api/suppliers.api';
import { listProducts } from '../../api/products.api';
import type { Product } from '../../api/products.api';
import { createPurchaseOrder, listPurchaseOrders, receivePurchaseOrder } from '../../api/purchase-orders.api';
import type { CreatePurchaseOrderItemInput, PurchaseOrder } from '../../api/purchase-orders.api';

interface DraftLine {
  productId: string;
  variantId: string;
  quantityOrdered: string;
  costPrice: string;
}

function emptyLine(): DraftLine {
  return { productId: '', variantId: '', quantityOrdered: '', costPrice: '' };
}

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
    } catch {
      setError('Failed to create purchase order. Check that all lines have a product, quantity, and cost.');
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

  return (
    <section style={{ maxWidth: 900, margin: '40px auto' }}>
      <p>
        <Link to="/admin">&larr; Dashboard</Link>
      </p>
      <h1>Purchase Orders</h1>

      <form onSubmit={handleCreate} style={{ marginBottom: 32, border: '1px solid #444', padding: 16 }}>
        <h2>Create purchase order</h2>
        <div style={{ display: 'flex', gap: 16 }}>
          <label>
            Branch
            <br />
            <select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Supplier
            <br />
            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} required>
              <option value="" disabled>
                Select a supplier
              </option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div style={{ marginTop: 8 }}>
          <label>
            Notes
            <br />
            <input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
        </div>

        <h3 style={{ marginTop: 16 }}>Line items</h3>
        {lines.map((line, i) => {
          const variants = variantsFor(line.productId);
          return (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <select
                value={line.productId}
                onChange={(e) => updateLine(i, 'productId', e.target.value)}
                required
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
                style={{ width: 80 }}
                value={line.quantityOrdered}
                onChange={(e) => updateLine(i, 'quantityOrdered', e.target.value)}
                required
              />
              <input
                type="number"
                min={0}
                step="0.01"
                placeholder="Cost price"
                style={{ width: 100 }}
                value={line.costPrice}
                onChange={(e) => updateLine(i, 'costPrice', e.target.value)}
                required
              />
              {lines.length > 1 && (
                <button type="button" onClick={() => removeLine(i)}>
                  Remove
                </button>
              )}
            </div>
          );
        })}
        <button type="button" onClick={addLine}>
          + Add line
        </button>

        {error && (
          <p role="alert" style={{ color: 'red' }}>
            {error}
          </p>
        )}
        <div>
          <button type="submit" disabled={submitting} style={{ marginTop: 12 }}>
            {submitting ? 'Creating...' : 'Create purchase order'}
          </button>
        </div>
      </form>

      <h2>All purchase orders</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {orders.map((po) => (
            <li key={po.id} style={{ border: '1px solid #333', padding: 12, marginBottom: 8 }}>
              <strong>{po.supplier.name}</strong> — {po.branch.name} — status: <strong>{po.status}</strong>
              {po.notes && ` — ${po.notes}`}
              <ul>
                {po.items.map((item) => (
                  <li key={item.id}>
                    {item.product.name}
                    {item.variant ? ` (${item.variant.name})` : ''} — ordered {item.quantityOrdered}, received{' '}
                    {item.quantityReceived} @ ₹{item.costPrice}
                  </li>
                ))}
              </ul>
              {po.status === 'ordered' && (
                <button type="button" disabled={receivingId === po.id} onClick={() => handleReceive(po.id)}>
                  {receivingId === po.id ? 'Receiving...' : 'Mark as received'}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
