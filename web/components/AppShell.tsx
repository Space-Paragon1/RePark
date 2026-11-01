'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { BellIcon, CarIcon, FlagIcon, HomeIcon, UserIcon } from './icons';
import { Logo, Spinner } from './ui';

// `short` labels fit the phone tab bar.
const NAV = [
  { href: '/dashboard', label: 'Home',         short: 'Home',     Icon: HomeIcon },
  { href: '/report',    label: 'Report a car', short: 'Report',   Icon: FlagIcon },
  { href: '/vehicles',  label: 'My vehicles',  short: 'Vehicles', Icon: CarIcon },
  { href: '/alerts',    label: 'Alerts',       short: 'Alerts',   Icon: BellIcon },
  { href: '/account',   label: 'Account',      short: 'Account',  Icon: UserIcon },
];

/** Header, navigation, and sign-in guard for every signed-in page. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

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
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-6 px-5">
          <Link href="/dashboard" className="py-3">
            <Logo />
          </Link>
          <nav aria-label="Main" className="-mb-px hidden flex-1 gap-1 sm:flex">
            {NAV.map(item => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`whitespace-nowrap border-b-2 px-3 py-4 text-sm font-medium ${
                    active
                      ? 'border-brand text-brand'
                      : 'border-transparent text-text-secondary hover:text-text'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-28 pt-8 sm:pb-8">{children}</main>

      {/* Phone tab bar, like the mobile app */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-5 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] sm:hidden"
      >
        {NAV.map(item => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-col items-center gap-1 py-2 text-[11px] font-medium ${
                active ? 'text-brand' : 'text-text-secondary'
              }`}
            >
              <item.Icon className="size-6" />
              {item.short}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
