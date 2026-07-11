import { useState } from 'react';
import type { ReactNode } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { LogOut, Menu, X, ShieldCheck, UserRound, Sun, Moon } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { useThemeStore } from '../../store/theme.store';
import { logout } from '../../api/auth.api';

export interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  end?: boolean;
}

export default function AppShell({ navItems, homePath }: { navItems: NavItem[]; homePath: string }) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await logout();
    clearSession();
    navigate('/login');
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    clsx(
      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
      isActive ? 'bg-brand-600 text-white' : 'text-zinc-400 hover:bg-surface-200 hover:text-zinc-100',
    );

  const sidebarContent = (
    <>
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
          Ze
        </div>
        <span className="text-lg font-semibold tracking-tight text-zinc-100">Zepos</span>
      </div>

      <nav className="mt-6 flex flex-1 flex-col gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={navLinkClass}
            onClick={() => setMobileOpen(false)}
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto border-t border-surface-300 pt-4">
        <div className="flex items-center gap-2 px-3 py-2 text-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-300 text-zinc-300">
            {user?.role === 'admin' ? <ShieldCheck size={16} /> : <UserRound size={16} />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-zinc-100">{user?.name}</p>
            <p className="truncate text-xs capitalize text-zinc-500">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
        <button
          onClick={toggleTheme}
          className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-surface-200 hover:text-zinc-100"
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          {theme === 'light' ? 'Dark mode' : 'Light mode'}
        </button>
        <button
          onClick={handleLogout}
          className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-surface-200 hover:text-red-400"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-surface-0">
      {/* Mobile topbar */}
      <div className="flex items-center justify-between border-b border-surface-300 bg-surface-50 px-4 py-3 md:hidden">
        <NavLink to={homePath} className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-xs font-bold text-white">
            Ze
          </div>
          <span className="font-semibold text-zinc-100">Zepos</span>
        </NavLink>
        <div className="flex items-center gap-3">
          <button onClick={toggleTheme} className="text-zinc-300" aria-label="Toggle theme">
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <button onClick={() => setMobileOpen((v) => !v)} className="text-zinc-300">
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="flex flex-col border-b border-surface-300 bg-surface-50 p-3 md:hidden">{sidebarContent}</div>
      )}

      <div className="mx-auto flex max-w-[1400px]">
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-surface-300 bg-surface-50 p-3 md:flex">
          {sidebarContent}
        </aside>

        <main className="min-w-0 flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
