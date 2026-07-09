import { Receipt, Users, PauseCircle, Undo2, Settings as SettingsIcon } from 'lucide-react';
import AppShell from './AppShell';
import type { NavItem } from './AppShell';

const navItems: NavItem[] = [
  { to: '/cashier', label: 'Billing', icon: <Receipt size={18} />, end: true },
  { to: '/cashier/customers', label: 'Customers', icon: <Users size={18} /> },
  { to: '/cashier/held-sales', label: 'Held Sales', icon: <PauseCircle size={18} /> },
  { to: '/cashier/returns', label: 'Returns', icon: <Undo2 size={18} /> },
  { to: '/cashier/settings', label: 'Settings', icon: <SettingsIcon size={18} /> },
];

export default function CashierLayout() {
  return <AppShell navItems={navItems} homePath="/cashier" />;
}
