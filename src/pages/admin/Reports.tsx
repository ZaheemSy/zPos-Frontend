import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Tooltip, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { AlertTriangle, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { listBranches } from '../../api/branches.api';
import type { Branch } from '../../api/branches.api';
import {
  getCustomerCreditReport,
  getInventoryReport,
  getProfitReport,
  getSalesReport,
  getTaxReport,
} from '../../api/reports.api';
import type {
  CustomerCreditReport,
  InventoryReport,
  ProfitReport,
  SalesReport,
  TaxReport,
} from '../../api/reports.api';
import LoadingSpinner from '../../components/LoadingSpinner';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import { Table, THead, TBody, Tr, Th, Td } from '../../components/ui/Table';

export default function Reports() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const [sales, setSales] = useState<SalesReport | null>(null);
  const [tax, setTax] = useState<TaxReport | null>(null);
  const [profit, setProfit] = useState<ProfitReport | null>(null);
  const [inventory, setInventory] = useState<InventoryReport | null>(null);
  const [credit, setCredit] = useState<CustomerCreditReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listBranches().then(setBranches);
  }, []);

  function refresh() {
    setLoading(true);
    const filters = { branchId: branchId || undefined, from: from || undefined, to: to || undefined };
    Promise.all([
      getSalesReport(filters),
      getTaxReport(filters),
      getProfitReport(filters),
      getInventoryReport(filters),
      getCustomerCreditReport(),
    ])
      .then(([s, t, p, i, c]) => {
        setSales(s);
        setTax(t);
        setProfit(p);
        setInventory(i);
        setCredit(c);
      })
      .finally(() => setLoading(false));
  }

  useEffect(refresh, [branchId, from, to]);

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Sales, tax, profit, and stock — filtered by branch and date range."
        actions={
          <div className="flex flex-wrap gap-2">
            <Select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="w-44">
              <option value="">All branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
          </div>
        }
      />

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="flex flex-col gap-6">
          {sales && (
            <Card>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
                  <TrendingUp size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-zinc-200">Sales Report</h2>
                  <p className="text-xs text-zinc-500">
                    ₹{sales.totalRevenue.toFixed(2)} across {sales.totalSales} sale(s)
                  </p>
                </div>
              </div>

              {sales.byDay.length > 0 && (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={sales.byDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#24242e" />
                    <XAxis dataKey="date" stroke="#71717a" fontSize={12} />
                    <YAxis stroke="#71717a" fontSize={12} />
                    <Tooltip
                      contentStyle={{ background: '#131319', border: '1px solid #24242e', borderRadius: 8, fontSize: 13 }}
                      labelStyle={{ color: '#e4e4e7' }}
                    />
                    <Bar dataKey="revenue" fill="#6366f1" name="Revenue (₹)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}

              <Table className="mt-4">
                <THead>
                  <tr>
                    <Th>Branch</Th>
                    <Th>Sales</Th>
                    <Th>Revenue</Th>
                  </tr>
                </THead>
                <TBody>
                  {sales.byBranch.map((b) => (
                    <Tr key={b.branchId}>
                      <Td className="font-medium text-zinc-100">{b.branchName}</Td>
                      <Td>{b.count}</Td>
                      <Td>₹{b.revenue.toFixed(2)}</Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            </Card>
          )}

          {tax && (
            <Card>
              <h2 className="mb-4 text-sm font-semibold text-zinc-200">Tax Report</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {[
                  ['Taxable', tax.taxableAmount],
                  ['CGST', tax.cgstAmount],
                  ['SGST', tax.sgstAmount],
                  ['IGST', tax.igstAmount],
                  ['Cess', tax.cessAmount],
                  ['Total Tax', tax.totalTax],
                ].map(([label, value]) => (
                  <div key={label as string} className="rounded-lg bg-surface-200 p-3">
                    <p className="text-xs text-zinc-500">{label}</p>
                    <p className="mt-1 font-semibold text-zinc-100">₹{(value as number).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {profit && (
            <Card>
              <div className="mb-1 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600/15 text-brand-400">
                  <TrendingUp size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-zinc-200">Profit Report</h2>
                  <p className="text-xs text-zinc-500">
                    ₹{profit.totalProfit.toFixed(2)} profit ({profit.marginPercent}% margin)
                  </p>
                </div>
              </div>
              <p className="mb-4 text-xs text-zinc-600">
                Based on current cost price per product — sales don't snapshot historical cost.
              </p>
              <Table>
                <THead>
                  <tr>
                    <Th>Product</Th>
                    <Th>Qty</Th>
                    <Th>Revenue</Th>
                    <Th>Cost</Th>
                    <Th>Profit</Th>
                    <Th>Margin</Th>
                  </tr>
                </THead>
                <TBody>
                  {profit.byProduct.map((p) => (
                    <Tr key={p.productId}>
                      <Td className="font-medium text-zinc-100">{p.productName}</Td>
                      <Td>{p.quantity}</Td>
                      <Td>₹{p.revenue.toFixed(2)}</Td>
                      <Td>₹{p.cost.toFixed(2)}</Td>
                      <Td className="text-emerald-400">₹{p.profit.toFixed(2)}</Td>
                      <Td>{p.marginPercent}%</Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            </Card>
          )}

          {inventory && (
            <Card>
              <h2 className="mb-1 text-sm font-semibold text-zinc-200">Stock Report</h2>
              <p className="mb-4 text-xs text-zinc-500">Stock valuation: ₹{inventory.stockValuation.toFixed(2)}</p>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-red-400">
                    <AlertTriangle size={13} /> Low stock
                  </p>
                  {inventory.lowStock.length === 0 ? (
                    <p className="text-xs text-zinc-600">Nothing below reorder point.</p>
                  ) : (
                    <ul className="flex flex-col gap-1.5">
                      {inventory.lowStock.map((r, i) => (
                        <li key={i} className="text-xs text-zinc-300">
                          {r.productName}: <Badge tone="danger">{r.quantity}</Badge>{' '}
                          <span className="text-zinc-600">reorder at {r.reorderPoint}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-400">
                    <TrendingUp size={13} /> Best selling
                  </p>
                  <ul className="flex flex-col gap-1.5">
                    {inventory.bestSelling.map((r, i) => (
                      <li key={i} className="text-xs text-zinc-300">
                        {r.productName}: {r.quantitySold} sold, {r.stockOnHand} on hand
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-400">
                    <TrendingDown size={13} /> Slow moving
                  </p>
                  <ul className="flex flex-col gap-1.5">
                    {inventory.slowMoving.map((r, i) => (
                      <li key={i} className="text-xs text-zinc-300">
                        {r.productName}: {r.quantitySold} sold, {r.stockOnHand} on hand
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          )}

          {credit && (
            <Card>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/15 text-red-400">
                  <Wallet size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-zinc-200">Customer Credit Report</h2>
                  <p className="text-xs text-zinc-500">Outstanding: ₹{credit.totalOutstanding.toFixed(2)}</p>
                </div>
              </div>
              {credit.customers.length === 0 ? (
                <p className="text-sm text-zinc-500">No customers with an outstanding balance.</p>
              ) : (
                <Table>
                  <THead>
                    <tr>
                      <Th>Customer</Th>
                      <Th>Phone</Th>
                      <Th>Due</Th>
                    </tr>
                  </THead>
                  <TBody>
                    {credit.customers.map((c) => (
                      <Tr key={c.id}>
                        <Td className="font-medium text-zinc-100">{c.name}</Td>
                        <Td>{c.phone}</Td>
                        <Td className="text-red-400">₹{c.totalDue.toFixed(2)}</Td>
                      </Tr>
                    ))}
                  </TBody>
                </Table>
              )}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
