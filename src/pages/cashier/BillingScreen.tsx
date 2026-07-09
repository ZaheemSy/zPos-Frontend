import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { logout } from '../../api/auth.api';
import { useAuthStore } from '../../store/auth.store';
import { useCartStore } from '../../store/cart.store';
import type { CartItem } from '../../store/cart.store';
import { listInventory } from '../../api/inventory.api';
import type { InventoryRow } from '../../api/inventory.api';
import { listCustomers } from '../../api/customers.api';
import type { Customer } from '../../api/customers.api';
import { createSale } from '../../api/sales.api';
import type { PaymentInput, Sale } from '../../api/sales.api';
import { calculateLineItem } from '../../utils/gst.utils';
import Invoice from '../../print-templates/Invoice';
import type { InvoiceFormat } from '../../print-templates/Invoice';
import { listSettings } from '../../api/settings.api';

export default function BillingScreen() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);
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
  const [printFormat, setPrintFormat] = useState<InvoiceFormat>('A4');
  const [footerNote, setFooterNote] = useState<string | undefined>();
  const [declarationText, setDeclarationText] = useState<string | undefined>();

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: lastSale?.invoiceNumber ?? 'invoice',
  });

  useEffect(() => {
    listInventory().then(setInventory);
    listSettings().then((rows) => {
      const map: Record<string, string> = {};
      rows.forEach((r) => (map[r.key] = r.value));
      if (map.printer_type === 'A4' || map.printer_type === 'A3' || map.printer_type === 'thermal') {
        setPrintFormat(map.printer_type);
      }
      setFooterNote(map.footer_note);
      setDeclarationText(map.declaration_text);
    });
  }, []);

  async function handleLogout() {
    await logout();
    clearSession();
    navigate('/login');
  }

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

  const splitTotal = round2(
    (Number(splitCash) || 0) + (Number(splitCard) || 0) + (Number(splitUpi) || 0),
  );
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
    } catch {
      setError('Failed to complete sale. Check stock levels and payment amounts.');
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
    } catch {
      setError('Failed to hold sale.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ display: 'flex', gap: 24, maxWidth: 1100, margin: '20px auto', alignItems: 'flex-start' }}>
      <section style={{ flex: 1 }}>
        <p>
          <Link to="/cashier/customers">Customers</Link> · <Link to="/cashier/held-sales">Held Sales</Link> ·{' '}
          <Link to="/cashier/returns">Returns</Link> · <Link to="/cashier/settings">Settings</Link>
        </p>
        <h1>Billing</h1>
        <p>Welcome, {user?.name}.</p>

        <input
          id="product-search"
          autoFocus
          placeholder="Search product by name..."
          value={productSearch}
          onChange={(e) => setProductSearch(e.target.value)}
          style={{ width: '100%', fontSize: 18, padding: 8 }}
        />

        <ul style={{ listStyle: 'none', padding: 0, marginTop: 8 }}>
          {searchResults.map((row) => (
            <li
              key={`${row.productId}:${row.variantId ?? ''}`}
              onClick={() => addToCart(row)}
              style={{ border: '1px solid #333', padding: 8, marginBottom: 4, cursor: 'pointer' }}
            >
              {row.product.name}
              {row.variant ? ` - ${row.variant.name}` : ''} — stock: {row.quantity} — ₹{row.sellingPrice}
            </li>
          ))}
        </ul>

        <button onClick={handleLogout} style={{ marginTop: 24 }}>
          Logout
        </button>
      </section>

      <section style={{ flex: 1, border: '1px solid #444', padding: 16 }}>
        <h2>Cart</h2>

        <div style={{ marginBottom: 12 }}>
          {cart.customerId ? (
            <div>
              Customer: <strong>{cart.customerLabel}</strong>{' '}
              <button type="button" onClick={() => cart.setCustomer(null, null)}>
                Clear
              </button>
            </div>
          ) : (
            <div>
              <input
                placeholder="Search customer by name/phone (optional)"
                value={customerSearch}
                onChange={(e) => handleCustomerSearch(e.target.value)}
              />
              {customerResults.map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    cart.setCustomer(c.id, c.name);
                    setCustomerResults([]);
                  }}
                  style={{ cursor: 'pointer', padding: 4 }}
                >
                  {c.name} {c.phone && `(${c.phone})`}
                </div>
              ))}
            </div>
          )}
        </div>

        <label>
          <input type="checkbox" checked={cart.isIgst} onChange={(e) => cart.setIgst(e.target.checked)} />
          {' IGST (inter-state sale)'}
        </label>

        <table style={{ width: '100%', marginTop: 12 }}>
          <tbody>
            {cart.items.map((item) => (
              <tr key={`${item.productId}:${item.variantId ?? ''}`}>
                <td>{item.name}</td>
                <td>
                  <input
                    type="number"
                    min={1}
                    max={item.stockAvailable}
                    style={{ width: 50 }}
                    value={item.quantity}
                    onChange={(e) => cart.updateQuantity(item.productId, item.variantId, Number(e.target.value))}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min={0}
                    placeholder="Discount"
                    style={{ width: 70 }}
                    value={item.discountAmount || ''}
                    onChange={(e) => cart.updateDiscount(item.productId, item.variantId, Number(e.target.value))}
                  />
                </td>
                <td>₹{(item.unitPrice * item.quantity - item.discountAmount).toFixed(2)}</td>
                <td>
                  <button type="button" onClick={() => cart.removeItem(item.productId, item.variantId)}>
                    x
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: 12, fontSize: 14 }}>
          <div>Taxable amount: ₹{taxableAmount.toFixed(2)}</div>
          {cart.isIgst ? <div>IGST: ₹{igstAmount.toFixed(2)}</div> : (
            <>
              <div>CGST: ₹{cgstAmount.toFixed(2)}</div>
              <div>SGST: ₹{sgstAmount.toFixed(2)}</div>
            </>
          )}
          {cessAmount > 0 && <div>Cess: ₹{cessAmount.toFixed(2)}</div>}
          <div>
            Special discount:{' '}
            <input
              type="number"
              min={0}
              style={{ width: 70 }}
              value={cart.specialDiscount || ''}
              onChange={(e) => cart.setSpecialDiscount(Number(e.target.value))}
            />
          </div>
          <div style={{ fontWeight: 'bold', fontSize: 18 }}>Total: ₹{total.toFixed(2)}</div>
        </div>

        <div style={{ marginTop: 16 }}>
          <div>
            {(['cash', 'card', 'upi', 'split'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setPaymentMode(mode)}
                style={{ fontWeight: paymentMode === mode ? 'bold' : 'normal', marginRight: 8 }}
              >
                {mode}
              </button>
            ))}
          </div>
          {paymentMode === 'split' ? (
            <div style={{ marginTop: 8 }}>
              <input
                type="number"
                placeholder="Cash"
                style={{ width: 80 }}
                value={splitCash}
                onChange={(e) => setSplitCash(e.target.value)}
              />
              <input
                type="number"
                placeholder="Card"
                style={{ width: 80, marginLeft: 4 }}
                value={splitCard}
                onChange={(e) => setSplitCard(e.target.value)}
              />
              <input
                type="number"
                placeholder="UPI"
                style={{ width: 80, marginLeft: 4 }}
                value={splitUpi}
                onChange={(e) => setSplitUpi(e.target.value)}
              />
              <div>Split total: ₹{splitTotal.toFixed(2)}</div>
            </div>
          ) : (
            <div style={{ marginTop: 8 }}>
              <input
                type="number"
                placeholder="Amount tendered"
                value={amountTendered}
                onChange={(e) => setAmountTendered(e.target.value)}
              />
            </div>
          )}
          <div>Change: ₹{change > 0 ? change.toFixed(2) : '0.00'}</div>
        </div>

        {error && (
          <p role="alert" style={{ color: 'red' }}>
            {error}
          </p>
        )}
        {lastSale && (
          <div style={{ marginTop: 8 }}>
            <p style={{ color: 'lightgreen' }}>Sale completed: {lastSale.invoiceNumber}</p>
            <select value={printFormat} onChange={(e) => setPrintFormat(e.target.value as InvoiceFormat)}>
              <option value="A4">A4</option>
              <option value="A3">A3</option>
              <option value="thermal">Thermal</option>
            </select>
            <button type="button" onClick={() => handlePrint()} style={{ marginLeft: 8 }}>
              Print Invoice
            </button>
          </div>
        )}

        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <button type="button" disabled={submitting || cart.items.length === 0} onClick={handleHoldSale}>
            Hold Sale
          </button>
          <button type="button" disabled={submitting || cart.items.length === 0} onClick={handleCompleteSale}>
            {submitting ? 'Processing...' : 'Complete Sale'}
          </button>
        </div>
      </section>

      {lastSale && (
        <div style={{ maxHeight: 500, overflow: 'auto', border: '1px solid #444' }}>
          <div ref={printRef}>
            <Invoice sale={lastSale} format={printFormat} footerNote={footerNote} declarationText={declarationText} />
          </div>
        </div>
      )}
    </div>
  );
}
