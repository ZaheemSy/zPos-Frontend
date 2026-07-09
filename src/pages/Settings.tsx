import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Printer, Save, Building2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import { listBranches, updateBranch } from '../api/branches.api';
import type { Branch } from '../api/branches.api';
import { listSettings, upsertSetting } from '../api/settings.api';
import { getErrorMessage } from '../utils/errorMessage';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';

const PRINTER_TYPES = ['A4', 'A3', 'thermal'];

export default function Settings() {
  const role = useAuthStore((s) => s.user?.role);
  const ownBranchId = useAuthStore((s) => s.user?.branchId);
  const isAdmin = role === 'admin';

  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState(ownBranchId ?? '');
  const [settingsMap, setSettingsMap] = useState<Record<string, string>>({});
  const [branch, setBranch] = useState<Branch | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin) {
      listBranches().then((b) => {
        setBranches(b);
        if (!branchId && b.length > 0) setBranchId(b[0].id);
      });
    }
  }, [isAdmin]);

  function refresh() {
    if (!branchId) return;
    listSettings(branchId).then((rows) => {
      const map: Record<string, string> = {};
      rows.forEach((r) => (map[r.key] = r.value));
      setSettingsMap(map);
    });
    if (isAdmin) {
      listBranches().then((b) => setBranch(b.find((x) => x.id === branchId) ?? null));
    }
  }

  useEffect(refresh, [branchId, isAdmin]);

  async function saveSetting(key: string, value: string, scopeToBranch: boolean) {
    setError(null);
    setSaved(null);
    try {
      await upsertSetting(key, value, scopeToBranch && branchId ? branchId : undefined);
      setSaved(`Saved ${key.replace(/_/g, ' ')}`);
      refresh();
    } catch (err) {
      setError(getErrorMessage(err, `Failed to save ${key}`));
    }
  }

  async function handlePrinterChange(value: string) {
    await saveSetting('printer_type', value, true);
  }

  async function handleBranchDetailsSubmit(e: FormEvent) {
    e.preventDefault();
    if (!branch) return;
    setError(null);
    setSaved(null);
    try {
      await updateBranch(branchId, {
        address: branch.address ?? undefined,
        phone: branch.phone ?? undefined,
        email: branch.email ?? undefined,
        gstin: branch.gstin ?? undefined,
        bankName: branch.bankName ?? undefined,
        bankBranch: branch.bankBranch ?? undefined,
      });
      setSaved('Branch details saved');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save branch details'));
    }
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        description={isAdmin ? 'Tenant-wide and branch-specific configuration.' : 'Printer settings for your branch.'}
        actions={
          isAdmin ? (
            <Select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="w-48">
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          ) : undefined
        }
      />

      {(saved || error) && (
        <div
          className={`mb-4 flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
            error ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'
          }`}
        >
          {error ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
          {error ?? saved}
        </div>
      )}

      <div className="flex flex-col gap-6">
        <Card>
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-200">
            <Printer size={16} className="text-brand-400" />
            Printer
          </h2>
          <Select
            label="Printer type"
            value={settingsMap.printer_type ?? 'A4'}
            onChange={(e) => handlePrinterChange(e.target.value)}
            className="max-w-xs"
          >
            {PRINTER_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </Card>

        {isAdmin && (
          <>
            <Card>
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-200">
                <Save size={16} className="text-brand-400" />
                Invoice &amp; loyalty
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Invoice prefix (this branch)"
                  value={settingsMap.invoice_prefix ?? ''}
                  onChange={(e) => setSettingsMap((m) => ({ ...m, invoice_prefix: e.target.value }))}
                  onBlur={(e) => saveSetting('invoice_prefix', e.target.value, true)}
                />
                <Input
                  label="Loyalty points per ₹1 (tenant-wide)"
                  type="number"
                  min={0}
                  step="0.1"
                  value={settingsMap.loyalty_points_per_rupee ?? ''}
                  onChange={(e) => setSettingsMap((m) => ({ ...m, loyalty_points_per_rupee: e.target.value }))}
                  onBlur={(e) => saveSetting('loyalty_points_per_rupee', e.target.value, false)}
                />
                <Input
                  label="Footer note (tenant-wide)"
                  className="sm:col-span-2"
                  value={settingsMap.footer_note ?? ''}
                  onChange={(e) => setSettingsMap((m) => ({ ...m, footer_note: e.target.value }))}
                  onBlur={(e) => saveSetting('footer_note', e.target.value, false)}
                />
                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-xs font-medium text-zinc-400">Declaration text (tenant-wide)</span>
                  <textarea
                    rows={3}
                    value={settingsMap.declaration_text ?? ''}
                    onChange={(e) => setSettingsMap((m) => ({ ...m, declaration_text: e.target.value }))}
                    onBlur={(e) => saveSetting('declaration_text', e.target.value, false)}
                    className="w-full rounded-lg border border-surface-400 bg-surface-100 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </label>
              </div>
            </Card>

            {branch && (
              <Card>
                <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-200">
                  <Building2 size={16} className="text-brand-400" />
                  Branch details
                </h2>
                <form onSubmit={handleBranchDetailsSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label="Address"
                    className="sm:col-span-2"
                    value={branch.address ?? ''}
                    onChange={(e) => setBranch({ ...branch, address: e.target.value })}
                  />
                  <Input label="Phone" value={branch.phone ?? ''} onChange={(e) => setBranch({ ...branch, phone: e.target.value })} />
                  <Input label="Email" value={branch.email ?? ''} onChange={(e) => setBranch({ ...branch, email: e.target.value })} />
                  <Input label="GSTIN" value={branch.gstin ?? ''} onChange={(e) => setBranch({ ...branch, gstin: e.target.value })} />
                  <Input
                    label="Bank name"
                    value={branch.bankName ?? ''}
                    onChange={(e) => setBranch({ ...branch, bankName: e.target.value })}
                  />
                  <Input
                    label="Bank branch"
                    value={branch.bankBranch ?? ''}
                    onChange={(e) => setBranch({ ...branch, bankBranch: e.target.value })}
                  />
                  <div className="sm:col-span-2">
                    <Button type="submit" icon={<Save size={16} />}>
                      Save branch details
                    </Button>
                  </div>
                </form>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
