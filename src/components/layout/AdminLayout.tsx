import {
  LayoutDashboard,
  Package,
  Boxes,
  Truck,
  ClipboardList,
  Tag,
  Users,
  BarChart3,
  Settings as SettingsIcon,
} from 'lucide-react';
import AppShell from './AppShell';
import type { NavItem } from './AppShell';

const navItems: NavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={18} />, end: true },
  { to: '/admin/products', label: 'Products', icon: <Package size={18} /> },
  { to: '/admin/inventory', label: 'Inventory', icon: <Boxes size={18} /> },
  { to: '/admin/suppliers', label: 'Suppliers', icon: <Truck size={18} /> },
  { to: '/admin/purchase-orders', label: 'Purchase Orders', icon: <ClipboardList size={18} /> },
  { to: '/admin/coupons', label: 'Coupons', icon: <Tag size={18} /> },
  { to: '/admin/customers', label: 'Customers', icon: <Users size={18} /> },
  { to: '/admin/reports', label: 'Reports', icon: <BarChart3 size={18} /> },
  { to: '/admin/settings', label: 'Settings', icon: <SettingsIcon size={18} /> },
];

export default function AdminLayout() {
  return <AppShell navItems={navItems} homePath="/admin" />;
}
