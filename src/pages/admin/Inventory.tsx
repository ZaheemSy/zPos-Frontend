import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listBranches } from '../../api/branches.api';
import type { Branch } from '../../api/branches.api';
import { listProducts } from '../../api/products.api';
import type { Product } from '../../api/products.api';
import { listInventory, upsertInventory } from '../../api/inventory.api';
import type { InventoryRow } from '../../api/inventory.api';

interface Line {
  productId: string;
  variantId: string | null;
  label: string;
  unit: string;
}

export default function Inventory() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const [drafts, setDrafts] = useState<
    Record<string, { quantity: string; reorderPoint: string; costPrice: string; sellingPrice: string }>
  >({});

  useEffect(() => {
    listBranches().then((b) => {
      setBranches(b);
      if (b.length > 0) setBranchId(b[0].id);
    });
    listProducts().then(setProducts);
  }, []);

  useEffect(() => {
    if (!branchId) return;
    setLoading(true);
    listInventory(branchId)
      .then(setInventory)
      .finally(() => setLoading(false));
  }, [branchId]);

  const lines: Line[] = useMemo(() => {
    const result: Line[] = [];
    for (const p of products) {
      if (p.hasVariants) {
        for (const v of p.variants) {
          result.push({ productId: p.id, variantId: v.id, label: `${p.name} — ${v.name}`, unit: p.unit });
        }
      } else {
        result.push({ productId: p.id, variantId: null, label: p.name, unit: p.unit });
      }
    }
    return result;
  }, [products]);

  function keyFor(productId: string, variantId: string | null) {
    return `${productId}:${variantId ?? ''}`;
  }

  function existingRow(productId: string, variantId: string | null) {
    return inventory.find((row) => row.productId === productId && row.variantId === variantId);
  }

  function draftFor(line: Line) {
    const key = keyFor(line.productId, line.variantId);
    if (drafts[key]) return drafts[key];
    const existing = existingRow(line.productId, line.variantId);
    return {
      quantity: existing?.quantity ?? '0',
      reorderPoint: existing?.reorderPoint ?? '0',
      costPrice: existing?.costPrice ?? '0',
      sellingPrice: existing?.sellingPrice ?? '0',
    };
  }

  function updateDraft(line: Line, field: 'quantity' | 'reorderPoint' | 'costPrice' | 'sellingPrice', value: string) {
    const key = keyFor(line.productId, line.variantId);
    const current = draftFor(line);
    setDrafts((d) => ({ ...d, [key]: { ...current, [field]: value } }));
  }

  async function handleSave(line: Line) {
    const key = keyFor(line.productId, line.variantId);
    const draft = draftFor(line);
    setSavingKey(key);
    try {
      await upsertInventory({
        branchId,
        productId: line.productId,
        variantId: line.variantId ?? undefined,
        quantity: Number(draft.quantity),
        reorderPoint: Number(draft.reorderPoint),
        costPrice: Number(draft.costPrice),
        sellingPrice: Number(draft.sellingPrice),
      });
      const refreshed = await listInventory(branchId);
      setInventory(refreshed);
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <section style={{ maxWidth: 900, margin: '40px auto' }}>
      <p>
        <Link to="/admin">&larr; Dashboard</Link>
      </p>
      <h1>Inventory</h1>

      <label>
        Branch:{' '}
        <select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </label>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table style={{ width: '100%', marginTop: 16, borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Product</th>
              <th>Qty</th>
              <th>Reorder at</th>
              <th>Cost price</th>
              <th>Selling price</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => {
              const key = keyFor(line.productId, line.variantId);
              const draft = draftFor(line);
              const lowStock = Number(draft.quantity) <= Number(draft.reorderPoint);
              return (
                <tr key={key} style={{ color: lowStock ? 'red' : undefined }}>
                  <td>
                    {line.label} ({line.unit})
                  </td>
                  <td>
                    <input
                      type="number"
                      style={{ width: 70 }}
                      value={draft.quantity}
                      onChange={(e) => updateDraft(line, 'quantity', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      style={{ width: 70 }}
                      value={draft.reorderPoint}
                      onChange={(e) => updateDraft(line, 'reorderPoint', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      style={{ width: 80 }}
                      value={draft.costPrice}
                      onChange={(e) => updateDraft(line, 'costPrice', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      style={{ width: 80 }}
                      value={draft.sellingPrice}
                      onChange={(e) => updateDraft(line, 'sellingPrice', e.target.value)}
                    />
                  </td>
                  <td>
                    <button type="button" disabled={savingKey === key} onClick={() => handleSave(line)}>
                      {savingKey === key ? 'Saving...' : 'Save'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}
