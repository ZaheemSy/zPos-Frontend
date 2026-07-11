import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, PauseCircle, PlayCircle, Building2, AlertTriangle } from 'lucide-react';
import { listTenants, updateTenant } from '../../api/superadmin.api';
import type { TenantSummary } from '../../api/superadmin.api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { getErrorMessage } from '../../utils/errorMessage';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Table, THead, TBody, Tr, Th, Td } from '../../components/ui/Table';

function isNearExpiry(expiresAt: string | null) {
  if (!expiresAt) return false;
  const daysLeft = (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return daysLeft < 7;
}

export default function SuperAdminDashboard() {
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  function refresh() {
    setLoading(true);
    listTenants()
      .then(setTenants)
      .catch(() => setError('Failed to load companies'))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  async function toggleStatus(t: TenantSummary) {
    setBusyId(t.id);
    setError(null);
    try {
      await updateTenant(t.id, { status: t.status === 'active' ? 'suspended' : 'active' });
      refresh();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update company status'));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Companies"
        description="Every company provisioned on Zepos."
        actions={
          <Link to="/super-admin/new">
            <Button icon={<Plus size={16} />}>New company</Button>
          </Link>
        }
      />

      {error && (
        <p role="alert" className="mb-3 text-sm text-red-400">
          {error}
        </p>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : tenants.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-12 text-zinc-500">
          <Building2 size={28} />
          <p className="text-sm">No companies yet.</p>
        </Card>
      ) : (
        <Table>
          <THead>
            <tr>
              <Th>Company</Th>
              <Th>Branches</Th>
              <Th>Stock mode</Th>
              <Th>Status</Th>
              <Th>Expires</Th>
              <Th>Actions</Th>
            </tr>
          </THead>
          <TBody>
            {tenants.map((t) => (
              <Tr key={t.id}>
                <Td className="font-medium text-zinc-100">
                  <Link to={`/super-admin/companies/${t.id}`} className="hover:text-brand-400">
                    {t.name}
                  </Link>
                </Td>
                <Td>
                  {t.branchCount} / {t.maxBranches}
                </Td>
                <Td>
                  <Badge tone="neutral">{t.stockMode === 'shared' ? 'Shared stock' : 'Per-branch stock'}</Badge>
                </Td>
                <Td>
                  <Badge tone={t.status === 'active' ? 'success' : 'danger'}>{t.status}</Badge>
                </Td>
                <Td>
                  {t.expiresAt ? (
                    <span className={isNearExpiry(t.expiresAt) ? 'text-red-400' : 'text-zinc-300'}>
                      {isNearExpiry(t.expiresAt) && <AlertTriangle size={12} className="mr-1 inline" />}
                      {new Date(t.expiresAt).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="text-zinc-600">No expiry</span>
                  )}
                </Td>
                <Td>
                  <Button
                    size="sm"
                    variant={t.status === 'active' ? 'danger' : 'secondary'}
                    disabled={busyId === t.id}
                    onClick={() => toggleStatus(t)}
                    icon={t.status === 'active' ? <PauseCircle size={14} /> : <PlayCircle size={14} />}
                  >
                    {t.status === 'active' ? 'Suspend' : 'Resume'}
                  </Button>
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}
