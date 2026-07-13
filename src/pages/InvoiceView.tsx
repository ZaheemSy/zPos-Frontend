import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Printer } from 'lucide-react';
import { getSale } from '../api/sales.api';
import type { Sale } from '../api/sales.api';
import { listSettings } from '../api/settings.api';
import { getErrorMessage } from '../utils/errorMessage';
import LoadingSpinner from '../components/LoadingSpinner';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import Invoice from '../print-templates/Invoice';
import type { InvoiceFormat } from '../print-templates/Invoice';

export default function InvoiceView() {
  const { saleId } = useParams<{ saleId: string }>();
  const [sale, setSale] = useState<Sale | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [printFormat, setPrintFormat] = useState<InvoiceFormat>('A4');
  const [footerNote, setFooterNote] = useState<string | undefined>();
  const [declarationText, setDeclarationText] = useState<string | undefined>();

  useEffect(() => {
    if (!saleId) return;
    getSale(saleId)
      .then(setSale)
      .catch((err) => setError(getErrorMessage(err, 'Failed to load invoice')));
    listSettings().then((rows) => {
      const map: Record<string, string> = {};
      rows.forEach((r) => (map[r.key] = r.value));
      if (map.printer_type === 'A4' || map.printer_type === 'A3' || map.printer_type === 'thermal') {
        setPrintFormat(map.printer_type);
      }
      setFooterNote(map.footer_note);
      setDeclarationText(map.declaration_text);
    });
  }, [saleId]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-0 p-8 text-center text-red-400">
        {error}
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-0">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-300 bg-surface-50 px-4 py-3 print:hidden">
        <p className="text-sm text-zinc-400">
          Invoice <span className="font-medium text-zinc-100">{sale.invoiceNumber}</span>
        </p>
        <div className="flex items-center gap-2">
          <Select value={printFormat} onChange={(e) => setPrintFormat(e.target.value as InvoiceFormat)} className="!py-1.5">
            <option value="A4">A4</option>
            <option value="A3">A3</option>
            <option value="thermal">Thermal</option>
          </Select>
          <Button size="sm" icon={<Printer size={14} />} onClick={() => window.print()}>
            Print
          </Button>
        </div>
      </div>

      <div className="py-6">
        <Invoice sale={sale} format={printFormat} footerNote={footerNote} declarationText={declarationText} />
      </div>
    </div>
  );
}
