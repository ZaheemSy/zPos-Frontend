import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  IndianRupee,
  AlertTriangle,
  Wallet,
  Package,
  Boxes,
  Truck,
  ClipboardList,
  Tag,
  Users,
  BarChart3,
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { getInventoryReport, getSalesReport, getCustomerCreditReport } from '../../api/reports.api';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/LoadingSpinner';

const quickLinks = [
  { to: '/admin/products', label: 'Products', description: 'Catalog, HSN, tax rates', icon: Package },
  { to: '/admin/inventory', label: 'Inventory', description: 'Stock levels & pricing', icon: Boxes },
  { to: '/admin/suppliers', label: 'Suppliers', description: 'Vendor directory', icon: Truck },
  { to: '/admin/purchase-orders', label: 'Purchase Orders', description: 'Restock & receive', icon: ClipboardList },
  { to: '/admin/coupons', label: 'Coupons', description: 'Discounts & offers', icon: Tag },
  { to: '/admin/customers', label: 'Customers', description: 'CRM & loyalty', icon: Users },
  { to: '/admin/reports', label: 'Reports', description: 'Sales, tax, profit', icon: BarChart3 },
];

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const [revenue, setRevenue] = useState<number | null>(null);
  const [lowStockCount, setLowStockCount] = useState<number | null>(null);
  const [outstanding, setOutstanding] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getSalesReport({}), getInventoryReport({}), getCustomerCreditReport()])
      .then(([sales, inventory, credit]) => {
        setRevenue(sales.totalRevenue);
        setLowStockCount(inventory.lowStock.length);
        setOutstanding(credit.totalOutstanding);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title={`Welcome, ${user?.name ?? ''}`} description="Here's what's happening across your business." />

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
              <IndianRupee size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500">Total Revenue</p>
              <p className="text-xl font-semibold text-zinc-100">₹{revenue?.toFixed(2)}</p>
            </div>
          </Card>

          <Card className="flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400">
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500">Low Stock Items</p>
              <p className="text-xl font-semibold text-zinc-100">{lowStockCount}</p>
            </div>
          </Card>

          <Card className="flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-red-500/15 text-red-400">
              <Wallet size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500">Outstanding Dues</p>
              <p className="text-xl font-semibold text-zinc-100">₹{outstanding?.toFixed(2)}</p>
            </div>
          </Card>
        </div>
      )}

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">Quick access</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quickLinks.map(({ to, label, description, icon: Icon }) => (
          <Link key={to} to={to}>
            <Card className="flex items-center gap-4 transition-colors hover:border-brand-500 hover:bg-surface-200">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-600/15 text-brand-400">
                <Icon size={18} />
              </div>
              <div>
                <p className="font-medium text-zinc-100">{label}</p>
                <p className="text-xs text-zinc-500">{description}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
