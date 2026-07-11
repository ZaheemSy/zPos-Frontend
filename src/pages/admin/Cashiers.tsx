import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Plus, UserCog, Pencil, Trash2, Check, X, KeyRound } from 'lucide-react';
import { listBranches } from '../../api/branches.api';
import type { Branch } from '../../api/branches.api';
import { createCashier, deleteCashier, listCashiers, resetCashierPassword, updateCashier } from '../../api/users.api';
import type { Cashier } from '../../api/users.api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { getErrorMessage } from '../../utils/errorMessage';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { Table, THead, TBody, Tr, Th, Td } from '../../components/ui/Table';

export default function Cashiers() {
  const [cashiers, setCashiers] = useState<Cashier[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [branchId, setBranchId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({ name: '', branchId: '' });

  const [resettingId, setResettingId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState('');

  function refresh() {
    setLoading(true);
    Promise.all([listCashiers(), listBranches()])
      .then(([c, b]) => {
        setCashiers(c);
        setBranches(b);
        if (!branchId && b.length > 0) setBranchId(b[0].id);
      })
      .catch(() => setError('Failed to load cashiers'))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await createCashier({ name, email, password, branchId });
      setName('');
      setEmail('');
      setPassword('');
      refresh();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to add cashier'));
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(c: Cashier) {
    setEditingId(c.id);
    setEditDraft({ name: c.name, branchId: c.branchId ?? '' });
    setError(null);
  }

  async function saveEdit(id: string) {
    setError(null);
    try {
      await updateCashier(id, editDraft);
      setEditingId(null);
      refresh();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update cashier'));
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Remove cashier "${name}"? They will no longer be able to log in.`)) return;
    setError(null);
    try {
      await deleteCashier(id);
      refresh();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to remove cashier'));
    }
  }

  async function handleResetPassword(id: string) {
    setError(null);
    try {
      await resetCashierPassword(id, resetPassword);
      setResettingId(null);
      setResetPassword('');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to reset password'));
    }
  }

  return (
    <div>
      <PageHeader title="Cashiers" description="Add and manage cashier logins for your branches." />

      <Card className="mb-6">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-200">
          <UserCog size={16} className="text-brand-400" />
          Add cashier
        </h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input
            label="Password"
            type="password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Select label="Branch" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
          {error && (
            <p role="alert" className="col-span-full text-sm text-red-400">
              {error}
            </p>
          )}
          <div className="col-span-full">
            <Button type="submit" disabled={submitting} icon={<Plus size={16} />}>
              {submitting ? 'Saving...' : 'Add cashier'}
            </Button>
          </div>
        </form>
      </Card>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <Table>
          <THead>
            <tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Branch</Th>
              <Th>Actions</Th>
            </tr>
          </THead>
          <TBody>
            {cashiers.map((c) =>
              editingId === c.id ? (
                <Tr key={c.id}>
                  <Td>
                    <input
                      value={editDraft.name}
                      onChange={(e) => setEditDraft((d) => ({ ...d, name: e.target.value }))}
                      className="w-32 rounded-md border border-surface-400 bg-surface-100 px-2 py-1 text-xs text-zinc-100"
                    />
                  </Td>
                  <Td className="text-zinc-500">{c.email}</Td>
                  <Td>
                    <select
                      value={editDraft.branchId}
                      onChange={(e) => setEditDraft((d) => ({ ...d, branchId: e.target.value }))}
                      className="rounded-md border border-surface-400 bg-surface-100 px-2 py-1 text-xs text-zinc-100"
                    >
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </Td>
                  <Td>
                    <div className="flex gap-1.5">
                      <Button size="sm" onClick={() => saveEdit(c.id)} icon={<Check size={14} />}>
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} icon={<X size={14} />}>
                        Cancel
                      </Button>
                    </div>
                  </Td>
                </Tr>
              ) : resettingId === c.id ? (
                <Tr key={c.id}>
                  <Td className="font-medium text-zinc-100">{c.name}</Td>
                  <Td className="text-zinc-500">{c.email}</Td>
                  <Td colSpan={1}>
                    <input
                      type="password"
                      placeholder="New password"
                      minLength={6}
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                      className="w-32 rounded-md border border-surface-400 bg-surface-100 px-2 py-1 text-xs text-zinc-100"
                    />
                  </Td>
                  <Td>
                    <div className="flex gap-1.5">
                      <Button size="sm" onClick={() => handleResetPassword(c.id)} icon={<Check size={14} />}>
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setResettingId(null);
                          setResetPassword('');
                        }}
                        icon={<X size={14} />}
                      >
                        Cancel
                      </Button>
                    </div>
                  </Td>
                </Tr>
              ) : (
                <Tr key={c.id}>
                  <Td className="font-medium text-zinc-100">{c.name}</Td>
                  <Td className="text-zinc-500">{c.email}</Td>
                  <Td>{c.branch?.name ?? '—'}</Td>
                  <Td>
                    <div className="flex gap-1.5">
                      <Button size="sm" variant="secondary" onClick={() => startEdit(c)} icon={<Pencil size={13} />}>
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setResettingId(c.id)}
                        icon={<KeyRound size={13} />}
                      >
                        Reset password
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDelete(c.id, c.name)}
                        icon={<Trash2 size={13} />}
                      >
                        Remove
                      </Button>
                    </div>
                  </Td>
                </Tr>
              ),
            )}
          </TBody>
        </Table>
      )}
    </div>
  );
}
