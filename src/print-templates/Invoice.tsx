import type { Sale } from '../api/sales.api';
import { amountInWords } from '../utils/amountInWords';
import './invoice.css';

export type InvoiceFormat = 'A4' | 'A3' | 'thermal';

const DEFAULT_FOOTER_NOTE = 'You must bring bill in case of return product(s)';
const DEFAULT_DECLARATION =
  'Certified that all particulars given above are true and correct and the amount indicated represents the price actually charged and that there is no flow of additional consideration directly or indirectly from the buyer.';

function money(value: string | number): string {
  return Number(value).toFixed(2);
}

export default function Invoice({
  sale,
  format,
  footerNote,
  declarationText,
}: {
  sale: Sale;
  format: InvoiceFormat;
  footerNote?: string;
  declarationText?: string;
}) {
  const isThermal = format === 'thermal';
  const widthClass = format === 'A3' ? 'invoice-a3' : format === 'A4' ? 'invoice-a4' : 'invoice-thermal';

  return (
    <div className={widthClass} style={{ fontFamily: 'Arial, sans-serif', color: '#000', background: '#fff', padding: isThermal ? 8 : 24 }}>
      {!isThermal && (
        <header style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: 8 }}>
          <div>
            {sale.tenant.logoUrl && <img src={sale.tenant.logoUrl} alt="" style={{ height: 48 }} />}
            <h1 style={{ margin: 0 }}>{sale.tenant.name}</h1>
            <div>{sale.branch.address}</div>
            <div>
              {sale.branch.phone && `Phone: ${sale.branch.phone}`} {sale.branch.email && `| Email: ${sale.branch.email}`}
            </div>
            {sale.branch.gstin && <div>GSTIN: {sale.branch.gstin}</div>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div>Invoice #: {sale.invoiceNumber}</div>
            <div>Date: {new Date(sale.createdAt).toLocaleDateString()}</div>
            <div style={{ fontWeight: 'bold', fontSize: 18 }}>₹{money(sale.total)}</div>
          </div>
        </header>
      )}

      {isThermal && (
        <header style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 'bold' }}>{sale.tenant.name}</div>
          <div>{sale.invoiceNumber}</div>
          <div>{new Date(sale.createdAt).toLocaleString()}</div>
        </header>
      )}

      <section style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
        <div>
          <strong>Bill To:</strong>
          <div>{sale.customer?.name ?? 'Walk-in Customer'}</div>
          {sale.customer?.billingAddress && <div>{sale.customer.billingAddress}</div>}
          {sale.customer?.phone && <div>{sale.customer.phone}</div>}
          {sale.customer?.gstin && <div>GSTIN: {sale.customer.gstin}</div>}
        </div>
        {!isThermal && sale.shippingAddress && (
          <div>
            <strong>Ship To:</strong>
            <div>{sale.shippingName}</div>
            <div>{sale.shippingAddress}</div>
          </div>
        )}
      </section>

      <table style={{ width: '100%', marginTop: 8, fontSize: isThermal ? 11 : 13 }}>
        <tbody>
          <tr>
            <td>Invoice Date: {new Date(sale.createdAt).toLocaleDateString()}</td>
            <td>Payment Terms: {sale.paymentTerms ?? 'On Receipt'}</td>
            <td>Due Date: {sale.dueDate ? new Date(sale.dueDate).toLocaleDateString() : '-'}</td>
          </tr>
        </tbody>
      </table>

      <table style={{ width: '100%', marginTop: 8, borderCollapse: 'collapse', fontSize: isThermal ? 11 : 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #000' }}>
            <th>SI</th>
            <th>Description</th>
            {!isThermal && <th>HSN</th>}
            <th>Qty</th>
            {!isThermal && <th>Unit</th>}
            <th>Price</th>
            {!isThermal && <th>Tax%</th>}
            {!isThermal && <th>Dis</th>}
            <th>Taxable</th>
            {!isThermal && !sale.isIgst && (
              <>
                <th>CGST</th>
                <th>SGST</th>
              </>
            )}
            {!isThermal && sale.isIgst && <th>IGST</th>}
            {!isThermal && Number(sale.cessAmount) > 0 && <th>Cess</th>}
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {sale.items.map((item, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td>{item.itemDescription}</td>
              {!isThermal && <td>{item.hsnCode}</td>}
              <td>{item.quantity}</td>
              {!isThermal && <td>{item.unit}</td>}
              <td>{money(item.unitPrice)}</td>
              {!isThermal && <td>{item.taxPercent}%</td>}
              {!isThermal && <td>{money(item.discountAmount)}</td>}
              <td>{money(item.taxableValue)}</td>
              {!isThermal && !sale.isIgst && (
                <>
                  <td>{money(item.cgstAmount)}</td>
                  <td>{money(item.sgstAmount)}</td>
                </>
              )}
              {!isThermal && sale.isIgst && <td>{money(item.igstAmount)}</td>}
              {!isThermal && Number(sale.cessAmount) > 0 && <td>{money(item.cessAmount)}</td>}
              <td>{money(item.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <section style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
        {!isThermal && (
          <div style={{ maxWidth: '50%' }}>
            <strong>Amount in words:</strong>
            <div>{amountInWords(Number(sale.total))} Rupees Only</div>
          </div>
        )}
        <div style={{ textAlign: 'right', minWidth: isThermal ? '100%' : 220 }}>
          <div>Taxable Amount: ₹{money(sale.taxableAmount)}</div>
          {!sale.isIgst ? (
            <>
              <div>CGST: ₹{money(sale.cgstAmount)}</div>
              <div>SGST: ₹{money(sale.sgstAmount)}</div>
            </>
          ) : (
            <div>IGST: ₹{money(sale.igstAmount)}</div>
          )}
          {Number(sale.cessAmount) > 0 && <div>Cess: ₹{money(sale.cessAmount)}</div>}
          <div>Subtotal: ₹{money(sale.subtotal)}</div>
          {Number(sale.specialDiscount) > 0 && <div>Special Discount: ₹{money(sale.specialDiscount)}</div>}
          <div style={{ fontWeight: 'bold' }}>Total: ₹{money(sale.total)}</div>
          <div>Payment Received: ₹{money(sale.amountReceived)}</div>
          <div>Balance: ₹{money(sale.balance)}</div>
        </div>
      </section>

      {!isThermal && (
        <>
          {(sale.branch.bankName || sale.branch.bankBranch) && (
            <section style={{ marginTop: 12 }}>
              <strong>Bank Details:</strong>
              <div>{sale.branch.bankName}</div>
              <div>{sale.branch.bankBranch}</div>
            </section>
          )}

          <section style={{ marginTop: 12, fontSize: 11 }}>{declarationText || DEFAULT_DECLARATION}</section>

          <section style={{ marginTop: 24, textAlign: 'right' }}>
            <div>For {sale.tenant.name}</div>
            <div style={{ marginTop: 32 }}>Authorized Signatory</div>
          </section>
        </>
      )}

      <footer style={{ marginTop: 16, fontSize: 10, textAlign: 'center', borderTop: '1px solid #ccc', paddingTop: 4 }}>
        <div>{footerNote || DEFAULT_FOOTER_NOTE}</div>
        <div>Computer generated invoice</div>
      </footer>
    </div>
  );
}
