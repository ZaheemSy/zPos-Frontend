import { Building2 } from 'lucide-react';
import AppShell from './AppShell';
import type { NavItem } from './AppShell';

const navItems: NavItem[] = [{ to: '/super-admin', label: 'Companies', icon: <Building2 size={18} />, end: true }];

export default function SuperAdminLayout() {
  return <AppShell navItems={navItems} homePath="/super-admin" />;
}
