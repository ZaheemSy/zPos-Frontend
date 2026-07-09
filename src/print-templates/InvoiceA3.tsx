import type { Sale } from '../api/sales.api';
import Invoice from './Invoice';

export default function InvoiceA3({
  sale,
  footerNote,
  declarationText,
}: {
  sale: Sale;
  footerNote?: string;
  declarationText?: string;
}) {
  return <Invoice sale={sale} format="A3" footerNote={footerNote} declarationText={declarationText} />;
}
