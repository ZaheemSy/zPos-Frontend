import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { listBranches } from '../../api/branches.api';
import type { Branch } from '../../api/branches.api';
import { listProducts } from '../../api/products.api';
import type { Product } from '../../api/products.api';
import { listInventory, upsertInventory } from '../../api/inventory.api';
import type { InventoryRow } from '../../api/inventory.api';
import LoadingSpinner from '../../components/LoadingSpinner';
import PageHeader from '../../components/ui/PageHeader';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { Table, THead, TBody, Tr, Th, Td } from '../../components/ui/Table';

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

  const cellInput = 'w-20 rounded-md border border-surface-400 bg-surface-100 px-2 py-1 text-sm text-zinc-100';

  return (
    <div>
      <PageHeader
        title="Inventory"
        description="Set stock, reorder points, and pricing per branch."
        actions={
          <Select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="w-48">
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        }
      />

      {loading ? (
        <LoadingSpinner />
      ) : (
        <Table>
          <THead>
            <tr>
              <Th>Product</Th>
              <Th>Qty</Th>
              <Th>Reorder at</Th>
              <Th>Cost price</Th>
              <Th>Selling price</Th>
              <Th></Th>
            </tr>
          </THead>
          <TBody>
            {lines.map((line) => {
              const key = keyFor(line.productId, line.variantId);
              const draft = draftFor(line);
              const lowStock = Number(draft.quantity) <= Number(draft.reorderPoint);
              return (
                <Tr key={key}>
                  <Td className={lowStock ? 'text-red-400' : undefined}>
                    <span className="flex items-center gap-1.5">
                      {lowStock && <AlertTriangle size={13} className="shrink-0" />}
                      {line.label} <span className="text-zinc-500">({line.unit})</span>
                    </span>
                  </Td>
                  <Td>
                    <input
                      type="number"
                      className={cellInput}
                      value={draft.quantity}
                      onChange={(e) => updateDraft(line, 'quantity', e.target.value)}
                    />
                  </Td>
                  <Td>
                    <input
                      type="number"
                      className={cellInput}
                      value={draft.reorderPoint}
                      onChange={(e) => updateDraft(line, 'reorderPoint', e.target.value)}
                    />
                  </Td>
                  <Td>
                    <input
                      type="number"
                      className={cellInput}
                      value={draft.costPrice}
                      onChange={(e) => updateDraft(line, 'costPrice', e.target.value)}
                    />
                  </Td>
                  <Td>
                    <input
                      type="number"
                      className={cellInput}
                      value={draft.sellingPrice}
                      onChange={(e) => updateDraft(line, 'sellingPrice', e.target.value)}
                    />
                  </Td>
                  <Td>
                    <Button size="sm" variant="secondary" disabled={savingKey === key} onClick={() => handleSave(line)}>
                      {savingKey === key ? 'Saving...' : 'Save'}
                    </Button>
                  </Td>
                </Tr>
              );
            })}
          </TBody>
        </Table>
      )}
    </div>
  );
}
