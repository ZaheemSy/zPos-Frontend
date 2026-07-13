import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  X,
  Plus,
  Minus,
  User,
  UserRound,
  Banknote,
  CreditCard,
  Smartphone,
  SplitSquareHorizontal,
  PauseCircle,
  CheckCircle2,
  Printer,
  AlertCircle,
  PackageSearch,
} from 'lucide-react';
import { useCartStore } from '../../store/cart.store';
import type { CartItem } from '../../store/cart.store';
import { listInventory } from '../../api/inventory.api';
import type { InventoryRow } from '../../api/inventory.api';
import { listCustomers } from '../../api/customers.api';
import type { Customer } from '../../api/customers.api';
import { createSale } from '../../api/sales.api';
import type { PaymentInput, Sale } from '../../api/sales.api';
import { calculateLineItem } from '../../utils/gst.utils';
import { getErrorMessage } from '../../utils/errorMessage';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';

const PAYMENT_MODES = [
  { key: 'cash', label: 'Cash', icon: Banknote },
  { key: 'card', label: 'Card', icon: CreditCard },
  { key: 'upi', label: 'UPI', icon: Smartphone },
  { key: 'split', label: 'Split', icon: SplitSquareHorizontal },
] as const;

export default function BillingScreen() {
  const cart = useCartStore();

  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [productSearch, setProductSearch] = useState('');

  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);

  const [paymentMode, setPaymentMode] = useState<'cash' | 'card' | 'upi' | 'split'>('cash');
  const [amountTendered, setAmountTendered] = useState('');
  const [splitCash, setSplitCash] = useState('');
  const [splitCard, setSplitCard] = useState('');
  const [splitUpi, setSplitUpi] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSale, setLastSale] = useState<Sale | null>(null);

  useEffect(() => {
    listInventory().then(setInventory);
  }, []);

  const searchResults = useMemo(() => {
    if (!productSearch.trim()) return [];
    const q = productSearch.toLowerCase();
    return inventory.filter(
      (row) =>
        row.product.name.toLowerCase().includes(q) || (row.variant?.name.toLowerCase().includes(q) ?? false),
    );
  }, [productSearch, inventory]);

  function addToCart(row: InventoryRow) {
    const item: CartItem = {
      productId: row.productId,
      variantId: row.variantId,
      name: row.variant ? `${row.product.name} - ${row.variant.name}` : row.product.name,
      unit: row.product.unit,
      unitPrice: Number(row.sellingPrice),
      taxPercent: 18,
      cessPercent: 0,
      quantity: 1,
      discountAmount: 0,
      stockAvailable: Number(row.quantity),
    };
    cart.addItem(item);
    setProductSearch('');
  }

  function handleCustomerSearch(value: string) {
    setCustomerSearch(value);
    if (value.trim().length < 2) {
      setCustomerResults([]);
      return;
    }
    listCustomers(value).then(setCustomerResults);
  }

  const lineResults = cart.items.map((item) =>
    calculateLineItem({
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      discountAmount: item.discountAmount,
      taxPercent: item.taxPercent,
      cessPercent: item.cessPercent,
      isIgst: cart.isIgst,
    }),
  );

  const taxableAmount = round2(lineResults.reduce((s, l) => s + l.taxableValue, 0));
  const cgstAmount = round2(lineResults.reduce((s, l) => s + l.cgstAmount, 0));
  const sgstAmount = round2(lineResults.reduce((s, l) => s + l.sgstAmount, 0));
  const igstAmount = round2(lineResults.reduce((s, l) => s + l.igstAmount, 0));
  const cessAmount = round2(lineResults.reduce((s, l) => s + l.cessAmount, 0));
  const subtotal = round2(taxableAmount + cgstAmount + sgstAmount + igstAmount + cessAmount);
  const total = round2(subtotal - cart.specialDiscount);

  const splitTotal = round2((Number(splitCash) || 0) + (Number(splitCard) || 0) + (Number(splitUpi) || 0));
  const amountReceived = paymentMode === 'split' ? splitTotal : Number(amountTendered) || 0;
  const change = round2(amountReceived - total);

  function round2(n: number) {
    return Math.round(n * 100) / 100;
  }

  function buildPayments(): PaymentInput[] {
    if (paymentMode === 'split') {
      const payments: PaymentInput[] = [];
      if (Number(splitCash) > 0) payments.push({ paymentMode: 'cash', amount: Number(splitCash) });
      if (Number(splitCard) > 0) payments.push({ paymentMode: 'card', amount: Number(splitCard) });
      if (Number(splitUpi) > 0) payments.push({ paymentMode: 'upi', amount: Number(splitUpi) });
      return payments;
    }
    return [{ paymentMode, amount: Number(amountTendered) || total }];
  }

  function resetAfterSale() {
    cart.clear();
    setAmountTendered('');
    setSplitCash('');
    setSplitCard('');
    setSplitUpi('');
    setCustomerSearch('');
    setCustomerResults([]);
    listInventory().then(setInventory);
  }

  async function handleCompleteSale() {
    if (cart.items.length === 0) return;
    setError(null);
    setSubmitting(true);
    // Open the tab synchronously (still inside the click's call stack) so
    // browsers don't treat it as a blocked popup once the sale finishes.
    const invoiceTab = window.open('', '_blank');
    try {
      const sale = await createSale({
        customerId: cart.customerId ?? undefined,
        isIgst: cart.isIgst,
        specialDiscount: cart.specialDiscount,
        items: cart.items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId ?? undefined,
          quantity: i.quantity,
          discountAmount: i.discountAmount,
        })),
        payments: buildPayments(),
      });
      setLastSale(sale);
      resetAfterSale();
      if (invoiceTab) {
        invoiceTab.location.href = `/invoice/${sale.id}`;
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to complete sale. Check stock levels and payment amounts.'));
      invoiceTab?.close();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleHoldSale() {
    if (cart.items.length === 0) return;
    setError(null);
    setSubmitting(true);
    try {
      await createSale({
        customerId: cart.customerId ?? undefined,
        isIgst: cart.isIgst,
        specialDiscount: cart.specialDiscount,
        hold: true,
        items: cart.items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId ?? undefined,
          quantity: i.quantity,
          discountAmount: i.discountAmount,
        })),
      });
      resetAfterSale();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to hold sale.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_420px]">
      {/* Product search */}
      <div>
        <div className="relative mb-4">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input
            id="product-search"
            autoFocus
            placeholder="Search products by name..."
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            className="w-full rounded-xl border border-surface-400 bg-surface-100 py-3.5 pl-11 pr-4 text-base text-zinc-100 placeholder:text-zinc-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {productSearch.trim() && searchResults.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-surface-400 py-12 text-zinc-500">
            <PackageSearch size={28} />
            <p className="text-sm">No products match "{productSearch}"</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {searchResults.map((row) => {
            const lowStock = Number(row.quantity) <= 0;
            return (
              <button
                key={`${row.productId}:${row.variantId ?? ''}`}
                onClick={() => !lowStock && addToCart(row)}
                disabled={lowStock}
                className="flex flex-col items-start gap-1 rounded-xl border border-surface-300 bg-surface-100 p-3.5 text-left transition-colors hover:border-brand-500 hover:bg-surface-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <p className="font-medium text-zinc-100">
                  {row.product.name}
                  {row.variant ? ` - ${row.variant.name}` : ''}
                </p>
                <div className="flex w-full items-center justify-between">
                  <span className={`text-xs ${lowStock ? 'text-red-400' : 'text-zinc-500'}`}>
                    {lowStock ? 'Out of stock' : `${row.quantity} in stock`}
                  </span>
                  <span className="font-semibold text-brand-400">₹{row.sellingPrice}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cart */}
      <div className="flex flex-col gap-4">
        <Card>
          {cart.customerId ? (
            <div className="mb-3 flex items-center justify-between rounded-lg bg-brand-600/10 px-3 py-2 text-sm">
              <span className="flex items-center gap-2 text-brand-300">
                <User size={15} />
                {cart.customerLabel}
              </span>
              <button onClick={() => cart.setCustomer(null, null)} className="text-zinc-500 hover:text-zinc-300">
                <X size={15} />
              </button>
            </div>
          ) : (
            <div className="relative mb-3">
              <Input
                placeholder="Customer name/phone (optional)"
                value={customerSearch}
                onChange={(e) => handleCustomerSearch(e.target.value)}
              />
              {customerResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-surface-400 bg-surface-200 shadow-xl">
                  {customerResults.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        cart.setCustomer(c.id, c.name);
                        setCustomerResults([]);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-200 hover:bg-surface-300"
                    >
                      <UserRound size={14} className="text-zinc-500" />
                      {c.name} {c.phone && <span className="text-zinc-500">({c.phone})</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <label className="flex items-center gap-2 text-sm text-zinc-400">
            <input
              type="checkbox"
              checked={cart.isIgst}
              onChange={(e) => cart.setIgst(e.target.checked)}
              className="h-4 w-4 rounded border-surface-400 bg-surface-100 accent-brand-600"
            />
            IGST (inter-state sale)
          </label>

          <div className="mt-4 flex max-h-64 flex-col gap-2 overflow-y-auto">
            {cart.items.length === 0 && (
              <p className="py-6 text-center text-sm text-zinc-500">Cart is empty — search a product to add it.</p>
            )}
            {cart.items.map((item) => (
              <div key={`${item.productId}:${item.variantId ?? ''}`} className="rounded-lg border border-surface-300 p-2.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-zinc-100">{item.name}</p>
                  <button
                    onClick={() => cart.removeItem(item.productId, item.variantId)}
                    className="text-zinc-500 hover:text-red-400"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        cart.updateQuantity(item.productId, item.variantId, Math.max(1, item.quantity - 1))
                      }
                      className="flex h-6 w-6 items-center justify-center rounded bg-surface-300 text-zinc-300 hover:bg-surface-400"
                    >
                      <Minus size={12} />
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={item.stockAvailable}
                      value={item.quantity}
                      onChange={(e) => cart.updateQuantity(item.productId, item.variantId, Number(e.target.value))}
                      className="w-10 rounded border border-surface-400 bg-surface-100 py-0.5 text-center text-sm text-zinc-100"
                    />
                    <button
                      onClick={() =>
                        cart.updateQuantity(
                          item.productId,
                          item.variantId,
                          Math.min(item.stockAvailable, item.quantity + 1),
                        )
                      }
                      className="flex h-6 w-6 items-center justify-center rounded bg-surface-300 text-zinc-300 hover:bg-surface-400"
                    >
                      <Plus size={12} />
                    </button>
                    <input
                      type="number"
                      min={0}
                      placeholder="Disc."
                      value={item.discountAmount || ''}
                      onChange={(e) => cart.updateDiscount(item.productId, item.variantId, Number(e.target.value))}
                      className="ml-1 w-16 rounded border border-surface-400 bg-surface-100 px-1.5 py-0.5 text-xs text-zinc-100 placeholder:text-zinc-600"
                    />
                  </div>
                  <span className="font-semibold text-zinc-100">
                    ₹{(item.unitPrice * item.quantity - item.discountAmount).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-1.5 border-t border-surface-300 pt-3 text-sm">
            <div className="flex justify-between text-zinc-400">
              <span>Taxable amount</span>
              <span>₹{taxableAmount.toFixed(2)}</span>
            </div>
            {cart.isIgst ? (
              <div className="flex justify-between text-zinc-400">
                <span>IGST</span>
                <span>₹{igstAmount.toFixed(2)}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between text-zinc-400">
                  <span>CGST</span>
                  <span>₹{cgstAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>SGST</span>
                  <span>₹{sgstAmount.toFixed(2)}</span>
                </div>
              </>
            )}
            {cessAmount > 0 && (
              <div className="flex justify-between text-zinc-400">
                <span>Cess</span>
                <span>₹{cessAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-zinc-400">
              <span>Special discount</span>
              <input
                type="number"
                min={0}
                value={cart.specialDiscount || ''}
                onChange={(e) => cart.setSpecialDiscount(Number(e.target.value))}
                className="w-20 rounded border border-surface-400 bg-surface-100 px-1.5 py-0.5 text-right text-xs text-zinc-100"
              />
            </div>
            <div className="flex justify-between border-t border-surface-300 pt-2 text-base font-semibold text-zinc-100">
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="grid grid-cols-4 gap-2">
            {PAYMENT_MODES.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setPaymentMode(key)}
                className={`flex flex-col items-center gap-1 rounded-lg py-2.5 text-xs font-medium transition-colors ${
                  paymentMode === key
                    ? 'bg-brand-600 text-white'
                    : 'bg-surface-200 text-zinc-400 hover:bg-surface-300 hover:text-zinc-200'
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>

          {paymentMode === 'split' ? (
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Input type="number" placeholder="Cash" value={splitCash} onChange={(e) => setSplitCash(e.target.value)} />
              <Input type="number" placeholder="Card" value={splitCard} onChange={(e) => setSplitCard(e.target.value)} />
              <Input type="number" placeholder="UPI" value={splitUpi} onChange={(e) => setSplitUpi(e.target.value)} />
            </div>
          ) : (
            <div className="mt-3">
              <Input
                type="number"
                placeholder="Amount tendered"
                value={amountTendered}
                onChange={(e) => setAmountTendered(e.target.value)}
              />
            </div>
          )}

          <div className="mt-3 flex justify-between rounded-lg bg-surface-200 px-3 py-2 text-sm">
            <span className="text-zinc-400">Change due</span>
            <span className="font-semibold text-emerald-400">₹{change > 0 ? change.toFixed(2) : '0.00'}</span>
          </div>

          {error && (
            <div role="alert" className="mt-3 flex items-start gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          {lastSale && (
            <div className="mt-3 rounded-lg bg-emerald-500/10 p-3">
              <p className="flex items-center gap-2 text-sm font-medium text-emerald-400">
                <CheckCircle2 size={16} />
                Sale completed: {lastSale.invoiceNumber}
              </p>
              <p className="mt-1 text-xs text-emerald-400/80">Invoice opened in a new tab.</p>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                icon={<Printer size={14} />}
                className="mt-2"
                onClick={() => window.open(`/invoice/${lastSale.id}`, '_blank')}
              >
                Open invoice again
              </Button>
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              icon={<PauseCircle size={16} />}
              disabled={submitting || cart.items.length === 0}
              onClick={handleHoldSale}
            >
              Hold
            </Button>
            <Button
              icon={<CheckCircle2 size={16} />}
              disabled={submitting || cart.items.length === 0}
              onClick={handleCompleteSale}
            >
              {submitting ? 'Processing...' : 'Complete Sale'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
