import type { Sale } from '../api/sales.api';
import Invoice from './Invoice';

export default function InvoiceThermal({ sale }: { sale: Sale }) {
  return <Invoice sale={sale} format="thermal" />;
}
