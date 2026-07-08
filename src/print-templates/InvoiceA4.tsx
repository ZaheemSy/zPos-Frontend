import type { Sale } from '../api/sales.api';
import Invoice from './Invoice';

export default function InvoiceA4({ sale }: { sale: Sale }) {
  return <Invoice sale={sale} format="A4" />;
}
