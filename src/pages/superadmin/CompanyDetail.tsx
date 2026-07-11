import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Building2, KeyRound, Plus, Save, Check, X, Pencil } from 'lucide-react';
import {
  addBranch,
  getTenant,
  resetAdminPassword,
  updateSuperAdminBranch,
  updateTenant,
} from '../../api/superadmin.api';
import type { StockMode, TenantDetail, TenantStatus } from '../../api/superadmin.api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { getErrorMessage } from '../../utils/errorMessage';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Table, THead, TBody, Tr, Th, Td } from '../../components/ui/Table';

export default function CompanyDetail() {
  const { id } = useParams<{ id: string }>();
  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [maxBranches, setMaxBranches] = useState(1);
  const [stockMode, setStockMode] = useState<StockMode>('per_branch');
  const [status, setStatus] = useState<TenantStatus>('active');
  const [expiresAt, setExpiresAt] = useState('');
  const [planNote, setPlanNote] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchCashiers, setNewBranchCashiers] = useState(1);
  const [addingBranch, setAddingBranch] = useState(false);

  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [editCashierLimit, setEditCashierLimit] = useState(1);

  const [showResetPassword, setShowResetPassword] = useState(false);
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);

  function refresh() {
    if (!id) return;
    setLoading(true);
    getTenant(id)
      .then((t) => {
        setTenant(t);
        setMaxBranches(t.maxBranches);
        setStockMode(t.stockMode);
        setStatus(t.status);
        setExpiresAt(t.expiresAt ? t.expiresAt.slice(0, 10) : '');
        setPlanNote(t.planNote ?? '');
      })
      .catch(() => setError('Failed to load company'))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, [id]);

  async function handleSaveSettings(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setError(null);
    setSuccess(null);
    setSavingSettings(true);
    try {
      await updateTenant(id, {
        maxBranches,
        stockMode,
        status,
        expiresAt: expiresAt || null,
        planNote,
      });
      setSuccess('Company settings saved');
      refresh();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save settings'));
    } finally {
      setSavingSettings(false);
    }
  }

  async function handleAddBranch(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setError(null);
    setAddingBranch(true);
    try {
      await addBranch(id, { name: newBranchName, cashierLimit: newBranchCashiers });
      setNewBranchName('');
      setNewBranchCashiers(1);
      refresh();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to add branch'));
    } finally {
      setAddingBranch(false);
    }
  }

  async function handleSaveCashierLimit(branchId: string) {
    setError(null);
    try {
      await updateSuperAdminBranch(branchId, { cashierLimit: editCashierLimit });
      setEditingBranchId(null);
      refresh();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update cashier limit'));
    }
  }

  async function handleResetAdminPassword(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setError(null);
    setSuccess(null);
    setResettingPassword(true);
    try {
      await resetAdminPassword(id, newAdminPassword);
      setSuccess("Admin's password has been reset.");
      setNewAdminPassword('');
      setShowResetPassword(false);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to reset password'));
    } finally {
      setResettingPassword(false);
    }
  }

  if (loading) return <LoadingSpinner />;
  if (!tenant) return null;

  return (
    <div>
      <Link to="/super-admin" className="mb-3 inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200">
        <ArrowLeft size={14} /> Back to companies
      </Link>
      <PageHeader
        title={tenant.name}
        description={tenant.admin ? `Admin: ${tenant.admin.name} (${tenant.admin.email})` : 'No admin found'}
        actions={<Badge tone={tenant.status === 'active' ? 'success' : 'danger'}>{tenant.status}</Badge>}
      />

      {(error || success) && (
        <p role="alert" className={`mb-4 text-sm ${error ? 'text-red-400' : 'text-emerald-400'}`}>
          {error ?? success}
        </p>
      )}

      <div className="flex flex-col gap-6">
        <Card>
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-200">
            <Building2 size={16} className="text-brand-400" />
            Plan &amp; access
          </h2>
          <form onSubmit={handleSaveSettings} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Max branches"
              type="number"
              min={1}
              value={maxBranches}
              onChange={(e) => setMaxBranches(Number(e.target.value))}
            />
            <Select label="Stock mode" value={stockMode} onChange={(e) => setStockMode(e.target.value as StockMode)}>
              <option value="per_branch">Each branch keeps its own stock</option>
              <option value="shared">All branches share one stock pool</option>
            </Select>
            <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value as TenantStatus)}>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </Select>
            <Input label="Access expires" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
            <Input
              label="Plan note"
              className="sm:col-span-2"
              value={planNote}
              onChange={(e) => setPlanNote(e.target.value)}
            />
            <div className="sm:col-span-2">
              <Button type="submit" disabled={savingSettings} icon={<Save size={16} />}>
                {savingSettings ? 'Saving...' : 'Save settings'}
              </Button>
            </div>
          </form>
        </Card>

        <Card>
          <h2 className="mb-4 text-sm font-semibold text-zinc-200">
            Branches ({tenant.branches.length} / {tenant.maxBranches})
          </h2>
          <Table>
            <THead>
              <tr>
                <Th>Branch</Th>
                <Th>Cashiers</Th>
                <Th>Actions</Th>
              </tr>
            </THead>
            <TBody>
              {tenant.branches.map((b) =>
                editingBranchId === b.id ? (
                  <Tr key={b.id}>
                    <Td className="font-medium text-zinc-100">{b.name}</Td>
                    <Td>
                      <input
                        type="number"
                        min={1}
                        value={editCashierLimit}
                        onChange={(e) => setEditCashierLimit(Number(e.target.value))}
                        className="w-20 rounded-md border border-surface-400 bg-surface-100 px-2 py-1 text-sm text-zinc-100"
                      />
                    </Td>
                    <Td>
                      <div className="flex gap-1.5">
                        <Button size="sm" onClick={() => handleSaveCashierLimit(b.id)} icon={<Check size={14} />}>
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingBranchId(null)} icon={<X size={14} />}>
                          Cancel
                        </Button>
                      </div>
                    </Td>
                  </Tr>
                ) : (
                  <Tr key={b.id}>
                    <Td className="font-medium text-zinc-100">{b.name}</Td>
                    <Td>
                      {b.cashierCount} / {b.cashierLimit}
                    </Td>
                    <Td>
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={<Pencil size={13} />}
                        onClick={() => {
                          setEditingBranchId(b.id);
                          setEditCashierLimit(b.cashierLimit);
                        }}
                      >
                        Raise cashier limit
                      </Button>
                    </Td>
                  </Tr>
                ),
              )}
            </TBody>
          </Table>

          <form onSubmit={handleAddBranch} className="mt-4 flex flex-wrap items-end gap-2 border-t border-surface-300 pt-4">
            <Input
              label="New branch name"
              value={newBranchName}
              onChange={(e) => setNewBranchName(e.target.value)}
              className="w-48"
              required
            />
            <Input
              label="Cashiers"
              type="number"
              min={1}
              value={newBranchCashiers}
              onChange={(e) => setNewBranchCashiers(Number(e.target.value))}
              className="w-24"
              required
            />
            <Button type="submit" disabled={addingBranch} icon={<Plus size={16} />}>
              {addingBranch ? 'Adding...' : 'Add branch'}
            </Button>
          </form>
        </Card>

        <Card>
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-200">
            <KeyRound size={16} className="text-brand-400" />
            Admin credentials
          </h2>
          {!showResetPassword ? (
            <Button variant="secondary" onClick={() => setShowResetPassword(true)}>
              Reset admin's password
            </Button>
          ) : (
            <form onSubmit={handleResetAdminPassword} className="flex flex-wrap items-end gap-2">
              <Input
                label="New password"
                type="password"
                minLength={6}
                value={newAdminPassword}
                onChange={(e) => setNewAdminPassword(e.target.value)}
                className="w-56"
                required
              />
              <Button type="submit" disabled={resettingPassword}>
                {resettingPassword ? 'Saving...' : 'Set new password'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowResetPassword(false)}>
                Cancel
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
