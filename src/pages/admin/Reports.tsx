import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
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
    <section style={{ maxWidth: 900, margin: '40px auto' }}>
      <p>
        <Link to="/admin">&larr; Dashboard</Link>
      </p>
      <h1>Reports</h1>

      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <label>
          Branch:{' '}
          <select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
            <option value="">All branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          From: <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label>
          To: <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          {sales && (
            <div style={{ marginBottom: 32 }}>
              <h2>Sales Report</h2>
              <p>
                Total revenue: <strong>₹{sales.totalRevenue.toFixed(2)}</strong> across {sales.totalSales} sale(s)
              </p>
              {sales.byDay.length > 0 && (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={sales.byDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" fill="#4f8ef7" name="Revenue (₹)" />
                  </BarChart>
                </ResponsiveContainer>
              )}
              <table style={{ width: '100%', marginTop: 8 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Branch</th>
                    <th>Sales</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.byBranch.map((b) => (
                    <tr key={b.branchId}>
                      <td>{b.branchName}</td>
                      <td style={{ textAlign: 'center' }}>{b.count}</td>
                      <td style={{ textAlign: 'right' }}>₹{b.revenue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tax && (
            <div style={{ marginBottom: 32 }}>
              <h2>Tax Report</h2>
              <table>
                <tbody>
                  <tr>
                    <td>Taxable Amount</td>
                    <td>₹{tax.taxableAmount.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td>CGST</td>
                    <td>₹{tax.cgstAmount.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td>SGST</td>
                    <td>₹{tax.sgstAmount.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td>IGST</td>
                    <td>₹{tax.igstAmount.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td>Cess</td>
                    <td>₹{tax.cessAmount.toFixed(2)}</td>
                  </tr>
                  <tr style={{ fontWeight: 'bold' }}>
                    <td>Total Tax</td>
                    <td>₹{tax.totalTax.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {profit && (
            <div style={{ marginBottom: 32 }}>
              <h2>Profit Report</h2>
              <p style={{ fontSize: 12, color: '#888' }}>
                Based on current cost price per product (sales don't snapshot historical cost).
              </p>
              <p>
                Total profit: <strong>₹{profit.totalProfit.toFixed(2)}</strong> ({profit.marginPercent}% margin)
              </p>
              <table style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Product</th>
                    <th>Qty</th>
                    <th>Revenue</th>
                    <th>Cost</th>
                    <th>Profit</th>
                    <th>Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {profit.byProduct.map((p) => (
                    <tr key={p.productId}>
                      <td>{p.productName}</td>
                      <td style={{ textAlign: 'center' }}>{p.quantity}</td>
                      <td style={{ textAlign: 'right' }}>₹{p.revenue.toFixed(2)}</td>
                      <td style={{ textAlign: 'right' }}>₹{p.cost.toFixed(2)}</td>
                      <td style={{ textAlign: 'right' }}>₹{p.profit.toFixed(2)}</td>
                      <td style={{ textAlign: 'right' }}>{p.marginPercent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {inventory && (
            <div style={{ marginBottom: 32 }}>
              <h2>Stock Report</h2>
              <p>
                Stock valuation: <strong>₹{inventory.stockValuation.toFixed(2)}</strong>
              </p>

              <h3>Low stock</h3>
              {inventory.lowStock.length === 0 ? (
                <p>Nothing below reorder point.</p>
              ) : (
                <ul>
                  {inventory.lowStock.map((r, i) => (
                    <li key={i} style={{ color: 'red' }}>
                      {r.productName}: {r.quantity} (reorder at {r.reorderPoint})
                    </li>
                  ))}
                </ul>
              )}

              <h3>Best selling</h3>
              <ul>
                {inventory.bestSelling.map((r, i) => (
                  <li key={i}>
                    {r.productName}: {r.quantitySold} sold, {r.stockOnHand} on hand
                  </li>
                ))}
              </ul>

              <h3>Slow moving</h3>
              <ul>
                {inventory.slowMoving.map((r, i) => (
                  <li key={i}>
                    {r.productName}: {r.quantitySold} sold, {r.stockOnHand} on hand
                  </li>
                ))}
              </ul>
            </div>
          )}

          {credit && (
            <div style={{ marginBottom: 32 }}>
              <h2>Customer Credit Report</h2>
              <p>
                Total outstanding: <strong>₹{credit.totalOutstanding.toFixed(2)}</strong>
              </p>
              {credit.customers.length === 0 ? (
                <p>No customers with an outstanding balance.</p>
              ) : (
                <table style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left' }}>Customer</th>
                      <th>Phone</th>
                      <th>Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {credit.customers.map((c) => (
                      <tr key={c.id}>
                        <td>{c.name}</td>
                        <td style={{ textAlign: 'center' }}>{c.phone}</td>
                        <td style={{ textAlign: 'right' }}>₹{c.totalDue.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
