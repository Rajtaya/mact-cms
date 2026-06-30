'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import {
  LayoutDashboard, Scale, FolderOpen, Calculator, Receipt,
  CalendarDays, FileBarChart, Settings, ShieldCheck, Users,
  Moon, Sun, Search, LogOut, Menu,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { can, ROLE_LABELS, type Capability } from '@/lib/permissions';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: any;
  cap?: Capability;
}

const NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/cases', label: 'Cases', icon: FolderOpen, cap: 'cases.view' },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays, cap: 'cases.view' },
  { href: '/calculator', label: 'Compensation', icon: Calculator, cap: 'calculator.use' },
  { href: '/fees', label: 'Fees', icon: Receipt, cap: 'fees.view' },
  { href: '/reports', label: 'Reports', icon: FileBarChart, cap: 'cases.view' },
  { href: '/settings', label: 'Settings', icon: Settings, cap: 'masters.view' },
  { href: '/users', label: 'Users', icon: Users, cap: 'users.manage' },
  { href: '/audit', label: 'Audit Logs', icon: ShieldCheck, cap: 'audit.view' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading workspace…
      </div>
    );
  }

  const items = NAV.filter((n) => !n.cap || can(user.role, n.cap));

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 bg-sidebar text-sidebar-foreground transition-transform md:static md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center gap-2 px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Scale className="h-5 w-5" />
          </div>
          <span className="font-semibold">MACT CMS</span>
        </div>
        <nav className="px-3 py-2">
          {items.map((n) => {
            const active = pathname.startsWith(n.href);
            const Icon = n.icon;
            return (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'mb-1 flex items-center gap-3 rounded-md px-3 py-2 text-sm transition',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-sidebar-foreground/80 hover:bg-white/5',
                )}
              >
                <Icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenu={() => setOpen((v) => !v)} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

function Topbar({ onMenu }: { onMenu: () => void }) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [q, setQ] = useState('');

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card px-4">
      <button className="md:hidden" onClick={onMenu} aria-label="Menu">
        <Menu className="h-5 w-5" />
      </button>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (q.trim()) router.push(`/cases?search=${encodeURIComponent(q)}`);
        }}
        className="relative hidden flex-1 max-w-md sm:block"
      >
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search case no., claimant, vehicle, FIR…"
          className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </form>
      <div className="ml-auto flex items-center gap-3">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="rounded-md p-2 hover:bg-secondary"
          aria-label="Toggle theme"
        >
          <Sun className="h-4 w-4 dark:hidden" />
          <Moon className="hidden h-4 w-4 dark:block" />
        </button>
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium leading-tight">{user?.fullName}</p>
          <p className="text-xs text-muted-foreground">
            {user && ROLE_LABELS[user.role]}
          </p>
        </div>
        <button
          onClick={logout}
          className="rounded-md p-2 hover:bg-secondary"
          aria-label="Logout"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
