'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Car, House, Send, User, type LucideIcon } from 'lucide-react';
import { alertsApi } from '@/lib/api';
import { useAuth } from './AuthProvider';
import { ToastProvider } from './Toast';
import { ButtonLink, Logo, Spinner } from './ui';

type NavItem = { href: string; label: string; short: string; Icon: LucideIcon };

// `label` for the desktop bar, `short` for the phone tab bar.
const NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', short: 'Home',     Icon: House },
  { href: '/report',    label: 'Reports',   short: 'Report',   Icon: Send },
  { href: '/vehicles',  label: 'Vehicles',  short: 'Vehicles', Icon: Car },
  { href: '/alerts',    label: 'Alerts',    short: 'Alerts',   Icon: Bell },
  { href: '/account',   label: 'Account',   short: 'Account',  Icon: User },
];

/** Alerts still waiting on a reply, for the nav badge. Refreshes on navigation and focus. */
function usePendingAlerts(signedIn: boolean, pathname: string) {
  const [count, setCount] = useState(0);
  const load = useCallback(() => {
    alertsApi.list()
      .then(alerts => setCount(alerts.filter(a => !a.owner_response).length))
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (!signedIn) return;
    load();
  }, [signedIn, pathname, load]);
  useEffect(() => {
    window.addEventListener('focus', load);
    return () => window.removeEventListener('focus', load);
  }, [load]);
  return count;
}

/**
 * Signed-in pages (components.md, Navigation). From 840 px: a 64 high top bar with the
 * nav, an Alerts badge, the account icon and "Report a car". Below: a 64 high glass tab bar.
 * Also the sign-in guard.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const pending = usePendingAlerts(!!session, pathname);

  useEffect(() => {
    if (!loading && !session) {
      // Keep the query string too, e.g. /report?plate=ABC123 from a QR sticker.
      const here = pathname + window.location.search;
      router.replace(`/login?next=${encodeURIComponent(here)}`);
    }
  }, [loading, session, pathname, router]);

  if (loading || !session) {
    return (
      <div className="grid flex-1 place-items-center text-brand">
        <Spinner className="size-6" />
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-line bg-surface">
          <div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-5 min-[840px]:px-10">
            <Link href="/dashboard" aria-label="RePark home">
              <Logo />
            </Link>
            <nav aria-label="Main" className="hidden h-full flex-1 items-stretch gap-1 min-[840px]:flex">
              {NAV.slice(0, 4).map(item => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center gap-2 border-b-2 px-3 text-sm font-semibold transition-colors ${
                      active ? 'border-brand text-text' : 'border-transparent text-text-secondary hover:text-text'
                    }`}
                  >
                    {item.label}
                    {item.href === '/alerts' && <AlertBadge count={pending} />}
                  </Link>
                );
              })}
            </nav>
            <div className="ml-auto hidden items-center gap-3 min-[840px]:flex">
              <Link
                href="/account"
                aria-label="Account"
                aria-current={pathname === '/account' ? 'page' : undefined}
                className={`grid size-10 place-items-center rounded-full transition-colors hover:bg-surface-sunken ${
                  pathname === '/account' ? 'text-brand' : 'text-text-secondary'
                }`}
              >
                <User className="size-5" aria-hidden />
              </Link>
              <ButtonLink href="/report" icon={Send} className="h-10 px-4">Report a car</ButtonLink>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-[calc(96px+env(safe-area-inset-bottom))] pt-8 min-[840px]:px-10 min-[840px]:pb-12">
          {children}
        </main>

        {/* Phone tab bar */}
        <nav
          aria-label="Main"
          className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-line bg-surface/72 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl min-[840px]:hidden"
        >
          {NAV.map(item => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`relative flex h-16 flex-col items-center justify-center gap-1 text-[10px] font-semibold ${
                  active ? 'text-brand' : 'text-text-secondary'
                }`}
              >
                {active && <span className="absolute inset-x-5 top-0 h-0.5 rounded-b bg-brand" aria-hidden />}
                <span className="relative">
                  <item.Icon className="size-5" aria-hidden />
                  {item.href === '/alerts' && pending > 0 && (
                    <span className="absolute -right-2 -top-1.5">
                      <AlertBadge count={pending} />
                    </span>
                  )}
                </span>
                {item.short}
              </Link>
            );
          })}
        </nav>
      </div>
    </ToastProvider>
  );
}

/** Signal badge with a mono count. */
function AlertBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-signal px-1 font-mono text-[11px] font-semibold text-on-signal"
      aria-label={`${count} waiting for your reply`}
    >
      {count > 9 ? '9+' : count}
    </span>
  );
}
