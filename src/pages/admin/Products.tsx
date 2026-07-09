import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Plus, PackagePlus } from 'lucide-react';
import { addVariant, createProduct, listProducts } from '../../api/products.api';
import type { Product } from '../../api/products.api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { getErrorMessage } from '../../utils/errorMessage';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Table, THead, TBody, Tr, Th, Td } from '../../components/ui/Table';

const TAX_RATES = [0, 5, 12, 18, 28];

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [hsnCode, setHsnCode] = useState('');
  const [unit, setUnit] = useState('EA');
  const [taxPercent, setTaxPercent] = useState(18);
  const [cessPercent, setCessPercent] = useState(0);
  const [hasVariants, setHasVariants] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [variantDrafts, setVariantDrafts] = useState<Record<string, string>>({});

  function refresh() {
    setLoading(true);
    listProducts()
      .then(setProducts)
      .catch(() => setError('Failed to load products'))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await createProduct({ name, hsnCode, unit, taxPercent, cessPercent, hasVariants });
      setName('');
      setHsnCode('');
      setUnit('EA');
      setTaxPercent(18);
      setCessPercent(0);
      setHasVariants(false);
      refresh();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to create product'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddVariant(productId: string) {
    const variantName = variantDrafts[productId]?.trim();
    if (!variantName) return;
    await addVariant(productId, variantName);
    setVariantDrafts((d) => ({ ...d, [productId]: '' }));
    refresh();
  }

  return (
    <div>
      <PageHeader title="Products" description="Manage your product catalog, HSN codes, and tax rates." />

      <Card className="mb-6">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-200">
          <PackagePlus size={16} className="text-brand-400" />
          Add product
        </h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Input id="product-name" label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input id="product-hsn" label="HSN code" value={hsnCode} onChange={(e) => setHsnCode(e.target.value)} required />
          <Input id="product-unit" label="Unit" value={unit} onChange={(e) => setUnit(e.target.value)} required />
          <Select label="Tax %" value={taxPercent} onChange={(e) => setTaxPercent(Number(e.target.value))}>
            {TAX_RATES.map((rate) => (
              <option key={rate} value={rate}>
                {rate}%
              </option>
            ))}
          </Select>
          <Input
            label="Cess %"
            type="number"
            min={0}
            step="0.01"
            value={cessPercent}
            onChange={(e) => setCessPercent(Number(e.target.value))}
          />
          <label className="flex items-center gap-2 self-end pb-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={hasVariants}
              onChange={(e) => setHasVariants(e.target.checked)}
              className="h-4 w-4 rounded border-surface-400 bg-surface-100 accent-brand-600"
            />
            Has variants
          </label>

          {error && (
            <p role="alert" className="col-span-full text-sm text-red-400">
              {error}
            </p>
          )}

          <div className="col-span-full">
            <Button type="submit" disabled={submitting} icon={<Plus size={16} />}>
              {submitting ? 'Saving...' : 'Add product'}
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
              <Th>HSN</Th>
              <Th>Unit</Th>
              <Th>Tax</Th>
              <Th>Variants</Th>
            </tr>
          </THead>
          <TBody>
            {products.map((p) => (
              <Tr key={p.id}>
                <Td className="font-medium text-zinc-100">{p.name}</Td>
                <Td>{p.hsnCode}</Td>
                <Td>{p.unit}</Td>
                <Td>
                  <Badge tone="info">{p.taxPercent}%</Badge>
                  {Number(p.cessPercent) > 0 && (
                    <span className="ml-1.5 text-xs text-zinc-500">+{p.cessPercent}% cess</span>
                  )}
                </Td>
                <Td>
                  {p.hasVariants ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap gap-1">
                        {p.variants.length === 0 ? (
                          <span className="text-xs text-zinc-500">none yet</span>
                        ) : (
                          p.variants.map((v) => (
                            <Badge key={v.id} tone="neutral">
                              {v.name}
                            </Badge>
                          ))
                        )}
                      </div>
                      <div className="flex gap-1.5">
                        <input
                          placeholder="New variant"
                          value={variantDrafts[p.id] ?? ''}
                          onChange={(e) => setVariantDrafts((d) => ({ ...d, [p.id]: e.target.value }))}
                          className="w-32 rounded-md border border-surface-400 bg-surface-100 px-2 py-1 text-xs text-zinc-100 placeholder:text-zinc-600"
                        />
                        <Button size="sm" variant="secondary" onClick={() => handleAddVariant(p.id)}>
                          Add
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-zinc-600">—</span>
                  )}
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}
