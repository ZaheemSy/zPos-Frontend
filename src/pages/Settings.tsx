import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { listBranches, updateBranch } from '../api/branches.api';
import type { Branch } from '../api/branches.api';
import { listSettings, upsertSetting } from '../api/settings.api';
import { getErrorMessage } from '../utils/errorMessage';

const PRINTER_TYPES = ['A4', 'A3', 'thermal'];

export default function Settings() {
  const role = useAuthStore((s) => s.user?.role);
  const ownBranchId = useAuthStore((s) => s.user?.branchId);
  const homePath = role === 'admin' ? '/admin' : '/cashier';
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
      setSaved(`Saved ${key}`);
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
    <section style={{ maxWidth: 560, margin: '40px auto' }}>
      <p>
        <Link to={homePath}>&larr; Dashboard</Link>
      </p>
      <h1>Settings</h1>

      {isAdmin && (
        <label>
          Branch:{' '}
          <select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <div style={{ marginTop: 16 }}>
        <label>
          Printer type:{' '}
          <select value={settingsMap.printer_type ?? 'A4'} onChange={(e) => handlePrinterChange(e.target.value)}>
            {PRINTER_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isAdmin && (
        <>
          <div style={{ marginTop: 16 }}>
            <label>
              Invoice prefix:{' '}
              <input
                value={settingsMap.invoice_prefix ?? ''}
                onChange={(e) => setSettingsMap((m) => ({ ...m, invoice_prefix: e.target.value }))}
                onBlur={(e) => saveSetting('invoice_prefix', e.target.value, true)}
              />
            </label>
          </div>

          <div style={{ marginTop: 16 }}>
            <label>
              Footer note (tenant-wide):
              <br />
              <input
                style={{ width: '100%' }}
                value={settingsMap.footer_note ?? ''}
                onChange={(e) => setSettingsMap((m) => ({ ...m, footer_note: e.target.value }))}
                onBlur={(e) => saveSetting('footer_note', e.target.value, false)}
              />
            </label>
          </div>

          <div style={{ marginTop: 16 }}>
            <label>
              Declaration text (tenant-wide):
              <br />
              <textarea
                style={{ width: '100%' }}
                rows={3}
                value={settingsMap.declaration_text ?? ''}
                onChange={(e) => setSettingsMap((m) => ({ ...m, declaration_text: e.target.value }))}
                onBlur={(e) => saveSetting('declaration_text', e.target.value, false)}
              />
            </label>
          </div>

          <div style={{ marginTop: 16 }}>
            <label>
              Loyalty points per rupee (tenant-wide):{' '}
              <input
                type="number"
                min={0}
                step="0.1"
                style={{ width: 80 }}
                value={settingsMap.loyalty_points_per_rupee ?? ''}
                onChange={(e) => setSettingsMap((m) => ({ ...m, loyalty_points_per_rupee: e.target.value }))}
                onBlur={(e) => saveSetting('loyalty_points_per_rupee', e.target.value, false)}
              />
            </label>
          </div>

          {branch && (
            <form onSubmit={handleBranchDetailsSubmit} style={{ marginTop: 24, border: '1px solid #444', padding: 16 }}>
              <h2>Branch details</h2>
              <div>
                <label>
                  Address
                  <br />
                  <input
                    style={{ width: '100%' }}
                    value={branch.address ?? ''}
                    onChange={(e) => setBranch({ ...branch, address: e.target.value })}
                  />
                </label>
              </div>
              <div style={{ marginTop: 8 }}>
                <label>
                  Phone
                  <br />
                  <input value={branch.phone ?? ''} onChange={(e) => setBranch({ ...branch, phone: e.target.value })} />
                </label>
              </div>
              <div style={{ marginTop: 8 }}>
                <label>
                  Email
                  <br />
                  <input value={branch.email ?? ''} onChange={(e) => setBranch({ ...branch, email: e.target.value })} />
                </label>
              </div>
              <div style={{ marginTop: 8 }}>
                <label>
                  GSTIN
                  <br />
                  <input value={branch.gstin ?? ''} onChange={(e) => setBranch({ ...branch, gstin: e.target.value })} />
                </label>
              </div>
              <div style={{ marginTop: 8 }}>
                <label>
                  Bank name
                  <br />
                  <input
                    value={branch.bankName ?? ''}
                    onChange={(e) => setBranch({ ...branch, bankName: e.target.value })}
                  />
                </label>
              </div>
              <div style={{ marginTop: 8 }}>
                <label>
                  Bank branch
                  <br />
                  <input
                    value={branch.bankBranch ?? ''}
                    onChange={(e) => setBranch({ ...branch, bankBranch: e.target.value })}
                  />
                </label>
              </div>
              <button type="submit" style={{ marginTop: 12 }}>
                Save branch details
              </button>
            </form>
          )}
        </>
      )}

      {saved && <p style={{ color: 'lightgreen' }}>{saved}</p>}
      {error && (
        <p role="alert" style={{ color: 'red' }}>
          {error}
        </p>
      )}
    </section>
  );
}
