// Small shared UI building blocks, styled to match the mobile app.
import Link from 'next/link';
import type { Tone } from '@/lib/labels';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

const BUTTON_STYLES: Record<ButtonVariant, string> = {
  primary:   'bg-brand text-on-brand hover:bg-brand-pressed disabled:bg-brand/50',
  secondary: 'bg-surface text-text border border-line hover:bg-surface-sunken disabled:text-text-muted',
  danger:    'bg-surface text-stop border border-stop/30 hover:bg-stop-tint disabled:opacity-50',
  ghost:     'text-text-secondary hover:bg-surface-sunken disabled:opacity-50',
};

const BUTTON_BASE =
  'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold ' +
  'transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ' +
  'disabled:cursor-not-allowed';

export function Button({
  variant = 'primary',
  loading = false,
  className = '',
  children,
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; loading?: boolean }) {
  return (
    <button
      className={`${BUTTON_BASE} ${BUTTON_STYLES[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner className="size-4" />}
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = 'primary',
  className = '',
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={`${BUTTON_BASE} ${BUTTON_STYLES[variant]} ${className}`}>
      {children}
    </Link>
  );
}

export function Spinner({ className = 'size-6' }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
    />
  );
}

export function Card({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-2xl border border-line bg-surface p-5 shadow-sm ${className}`}>{children}</div>
  );
}

const BADGE_TONES: Record<Tone, string> = {
  neutral: 'bg-surface-sunken text-text-secondary',
  blue:    'bg-brand-tint text-brand',
  green:   'bg-go-tint text-go',
  red:     'bg-stop-tint text-stop',
  amber:   'bg-signal text-on-signal',
};

export function Badge({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold ${BADGE_TONES[tone]}`}>
      {children}
    </span>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-text">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-text-muted">{hint}</span>}
    </label>
  );
}

export const inputClass =
  'block w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-base text-text ' +
  'placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20';

export function PageHeader({ title, subtitle, action }: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text">{title}</h1>
        {subtitle && <p className="mt-1 text-text-secondary">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div role="alert" className="mb-4 rounded-lg border border-stop/30 bg-stop-tint px-4 py-3 text-sm text-stop">
      {message}
    </div>
  );
}

export function EmptyState({ title, body, action }: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-12 text-center">
      <p className="font-semibold text-text">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-text-secondary">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={`grid size-8 place-items-center rounded-lg text-lg font-black ${
          light ? 'bg-white text-field' : 'bg-brand text-on-brand'
        }`}
      >
        P
      </span>
      <span className={`text-lg font-bold tracking-tight ${light ? 'text-white' : 'text-text'}`}>RePark</span>
    </span>
  );
}
