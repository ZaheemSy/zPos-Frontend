import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, CheckCircle2, Plus } from 'lucide-react';
import { addBranch, createTenant } from '../../api/superadmin.api';
import type { StockMode } from '../../api/superadmin.api';
import { getErrorMessage } from '../../utils/errorMessage';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';

export default function CreateCompany() {
  const navigate = useNavigate();

  const [tenantId, setTenantId] = useState<string | null>(null);
  const [maxBranches, setMaxBranches] = useState(1);
  const [branchesCreated, setBranchesCreated] = useState(0);

  const [companyName, setCompanyName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [stockMode, setStockMode] = useState<StockMode>('per_branch');
  const [expiresAt, setExpiresAt] = useState('');
  const [planNote, setPlanNote] = useState('');
  const [step1Submitting, setStep1Submitting] = useState(false);
  const [step1Error, setStep1Error] = useState<string | null>(null);

  const [branchName, setBranchName] = useState('');
  const [cashierCount, setCashierCount] = useState(1);
  const [step2Submitting, setStep2Submitting] = useState(false);
  const [step2Error, setStep2Error] = useState<string | null>(null);

  async function handleCreateTenant(e: FormEvent) {
    e.preventDefault();
    setStep1Error(null);
    setStep1Submitting(true);
    try {
      const tenant = await createTenant({
        companyName,
        adminName,
        adminEmail,
        adminPassword,
        maxBranches,
        stockMode,
        expiresAt: expiresAt || undefined,
        planNote: planNote || undefined,
      });
      setTenantId(tenant.id);
    } catch (err) {
      setStep1Error(getErrorMessage(err, 'Failed to create company'));
    } finally {
      setStep1Submitting(false);
    }
  }

  async function handleAddBranch(e: FormEvent) {
    e.preventDefault();
    if (!tenantId) return;
    setStep2Error(null);
    setStep2Submitting(true);
    try {
      await addBranch(tenantId, { name: branchName, cashierLimit: cashierCount });
      setBranchesCreated((n) => n + 1);
      setBranchName('');
      setCashierCount(1);
    } catch (err) {
      setStep2Error(getErrorMessage(err, 'Failed to add branch'));
    } finally {
      setStep2Submitting(false);
    }
  }

  const done = tenantId && branchesCreated >= maxBranches;

  return (
    <div>
      <PageHeader title="New company" description="Provision a company's account, admin login, and branches." />

      {!tenantId && (
        <Card className="max-w-xl">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-200">
            <Building2 size={16} className="text-brand-400" />
            Step 1 — Company &amp; admin login
          </h2>
          <form onSubmit={handleCreateTenant} className="flex flex-col gap-3">
            <Input label="Company name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
            <Input label="Admin name" value={adminName} onChange={(e) => setAdminName(e.target.value)} required />
            <Input
              label="Admin email"
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              required
            />
            <Input
              label="Admin password"
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              minLength={6}
              required
            />
            <Input
              label="Number of branches"
              type="number"
              min={1}
              value={maxBranches}
              onChange={(e) => setMaxBranches(Number(e.target.value))}
              required
            />
            <Select label="Stock mode" value={stockMode} onChange={(e) => setStockMode(e.target.value as StockMode)}>
              <option value="per_branch">Each branch keeps its own stock</option>
              <option value="shared">All branches share one stock pool</option>
            </Select>
            <Input
              label="Access expires (optional)"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
            <Input label="Plan note (optional)" value={planNote} onChange={(e) => setPlanNote(e.target.value)} />
            {step1Error && (
              <p role="alert" className="text-sm text-red-400">
                {step1Error}
              </p>
            )}
            <Button type="submit" disabled={step1Submitting} className="self-start">
              {step1Submitting ? 'Creating...' : 'Create company & continue'}
            </Button>
          </form>
        </Card>
      )}

      {tenantId && !done && (
        <Card className="max-w-xl">
          <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-zinc-200">
            <Building2 size={16} className="text-brand-400" />
            Step 2 — Branches
          </h2>
          <p className="mb-4 text-xs text-zinc-500">
            Branch {branchesCreated + 1} of {maxBranches}
          </p>
          <form onSubmit={handleAddBranch} className="flex flex-col gap-3">
            <Input label="Branch name" value={branchName} onChange={(e) => setBranchName(e.target.value)} required />
            <Input
              label="How many cashiers does this branch have?"
              type="number"
              min={1}
              value={cashierCount}
              onChange={(e) => setCashierCount(Number(e.target.value))}
              required
            />
            {step2Error && (
              <p role="alert" className="text-sm text-red-400">
                {step2Error}
              </p>
            )}
            <Button type="submit" disabled={step2Submitting} icon={<Plus size={16} />} className="self-start">
              {step2Submitting ? 'Saving...' : 'Save branch'}
            </Button>
          </form>
        </Card>
      )}

      {done && (
        <Card className="flex max-w-xl flex-col items-center gap-3 py-10 text-center">
          <CheckCircle2 size={32} className="text-emerald-400" />
          <p className="font-medium text-zinc-100">Company provisioned</p>
          <p className="text-sm text-zinc-500">{companyName} is set up with {maxBranches} branch(es).</p>
          <Button onClick={() => navigate(`/super-admin/companies/${tenantId}`)}>View company</Button>
        </Card>
      )}
    </div>
  );
}
