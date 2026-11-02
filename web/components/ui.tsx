// Shared UI building blocks for the website (handoff components.md).
import Link from 'next/link';
import { CircleAlert, Info, TriangleAlert, type LucideIcon } from 'lucide-react';
import type { ChipTone, Status } from '@/lib/labels';

// ─── Buttons ──────────────────────────────────────────────────────────────────

export type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'quietStop' | 'destructive';

const BUTTON_STYLES: Record<ButtonVariant, string> = {
  primary:     'bg-brand text-on-brand hover:bg-brand-pressed active:bg-brand-pressed',
  secondary:   'border-[1.5px] border-text text-text hover:bg-surface-sunken active:bg-surface-sunken',
  quiet:       'text-brand hover:bg-brand-tint active:bg-brand-tint',
  // "Incorrect report" on alerts: a quiet button in stop colour.
  quietStop:   'text-stop hover:bg-stop-tint active:bg-stop-tint',
  destructive: 'bg-stop text-on-stop hover:bg-stop-pressed active:bg-stop-pressed',
};

const BUTTON_BASE =
  'inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-control px-5 text-[15px] font-bold ' +
  'transition-[background-color,transform] duration-150 ease-ui motion-safe:active:scale-[0.97] ' +
  'disabled:cursor-not-allowed';

function buttonClass(variant: ButtonVariant, dimmed: boolean, className: string) {
  return `${BUTTON_BASE} ${BUTTON_STYLES[variant]} ${dimmed ? 'opacity-45' : ''} ${className}`;
}

/**
 * Height 48, radius 10, label 700 15. Loading keeps the button, shows a spinner and
 * swaps the label to `loadingLabel` ("Sending"). Spinners only ever appear in buttons.
 */
export function Button({
  variant = 'primary',
  loading = false,
  loadingLabel,
  icon: Icon,
  className = '',
  children,
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  loading?: boolean;
  loadingLabel?: string;
  icon?: LucideIcon;
}) {
  return (
    <button
      className={buttonClass(variant, !!disabled && !loading, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner className="size-4" /> : Icon && <Icon className="size-[18px] shrink-0" aria-hidden />}
      {loading && loadingLabel ? loadingLabel : children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = 'primary',
  icon: Icon,
  className = '',
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  icon?: LucideIcon;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={buttonClass(variant, false, className)}>
      {Icon && <Icon className="size-[18px] shrink-0" aria-hidden />}
      {children}
    </Link>
  );
}

export function Spinner({ className = 'size-4' }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
    />
  );
}

// ─── Surfaces ─────────────────────────────────────────────────────────────────

/** Surface, 1 px line, radius 14. Hairlines first, no drop shadow. */
export function Card({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <div className={`rounded-card border border-line bg-surface p-5 ${className}`}>{children}</div>;
}

// ─── Status chips ─────────────────────────────────────────────────────────────

const CHIP_TONES: Record<ChipTone, string> = {
  signal:  'bg-signal text-on-signal',
  brand:   'bg-brand-tint text-brand',
  go:      'bg-go-tint text-go',
  stop:    'bg-stop-tint text-stop',
  neutral: 'bg-surface-sunken text-text-secondary',
};

/** Icon + word + colour, always together. 28 high (24 in dense rows). */
export function Chip({ status, dense = false, className = '' }: { status: Status; dense?: boolean; className?: string }) {
  const { Icon } = status;
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[5px] px-2.5 text-[13px] font-bold ${
        dense ? 'h-6' : 'h-7'
      } ${CHIP_TONES[status.tone]} ${className}`}
    >
      <Icon className="size-3.5 shrink-0" strokeWidth={2.4} aria-hidden />
      {status.label}
    </span>
  );
}

/** Delivery chip: mono label with a 1 px outline, e.g. "Push · 21:42". */
export function DeliveryChip({ icon: Icon, failed = false, children }: {
  icon: LucideIcon;
  failed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex h-7 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[5px] border px-2.5 font-mono text-xs font-semibold ${
        failed ? 'border-stop text-stop' : 'border-line-strong text-text-secondary'
      }`}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden />
      {children}
    </span>
  );
}

// ─── Fields ───────────────────────────────────────────────────────────────────

export function Field({
  label,
  hint,
  error,
  optional = false,
  children,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-text">
        {label} {optional && <span className="font-normal text-text-muted">optional</span>}
      </span>
      {children}
      {error ? (
        <span className="mt-1.5 flex gap-1.5 text-[13px] font-medium text-stop">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </span>
      ) : (
        hint && <span className="mt-1.5 block text-[13px] text-text-muted">{hint}</span>
      )}
    </label>
  );
}

/** 48 high, 1.5 px line-strong, radius 10. Focus: brand border and a 4 px brand-tint ring. */
export const inputClass =
  'block h-12 w-full rounded-control border-[1.5px] border-line-strong bg-surface px-3.5 text-base text-text ' +
  'placeholder:text-text-muted outline-none transition-[border-color,box-shadow] duration-200 ease-ui ' +
  'focus:border-brand focus:ring-4 focus:ring-brand-tint focus-visible:outline-none aria-invalid:border-stop';

/** For textareas: same field, taller. */
export const textareaClass = `${inputClass} h-auto min-h-24 py-3`;

// ─── Page furniture ───────────────────────────────────────────────────────────

export function PageHeader({ title, subtitle, action }: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[30px] font-extrabold leading-tight tracking-[-0.02em] text-text">{title}</h1>
        {subtitle && <p className="mt-1 text-text-secondary">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

type BannerTone = 'error' | 'notice' | 'warning';

const BANNER_STYLES: Record<BannerTone, { className: string; Icon: LucideIcon }> = {
  error:   { className: 'border border-stop bg-stop-tint text-text', Icon: CircleAlert },
  notice:  { className: 'border border-line-strong bg-surface-sunken text-text', Icon: Info },
  warning: { className: 'bg-signal-tint text-text', Icon: TriangleAlert },
};

/** Radius 10, 12 × 14 padding. Error: stop outline on stop-tint. Notice: sunken. Warning: signal-tint. */
export function Banner({ tone, children, className = '' }: {
  tone: BannerTone;
  children: React.ReactNode;
  className?: string;
}) {
  const { className: toneClass, Icon } = BANNER_STYLES[tone];
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`flex gap-2.5 rounded-control px-3.5 py-3 text-sm ${toneClass} ${className}`}
    >
      <Icon className={`mt-0.5 size-4 shrink-0 ${tone === 'error' ? 'text-stop' : ''}`} aria-hidden />
      <div>{children}</div>
    </div>
  );
}

export function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return <Banner tone="error" className="mb-4">{message}</Banner>;
}

/** 1 px dashed card, centred title 700 17, body 14 (max 260), optional icon and action. */
export function EmptyState({ title, body, icon: Icon, action }: {
  title: string;
  body: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-card border border-dashed border-line-strong px-6 py-7 text-center">
      {Icon && (
        <span className="mx-auto mb-3 grid size-14 place-items-center rounded-full border border-line text-text-secondary">
          <Icon className="size-6" aria-hidden />
        </span>
      )}
      <p className="text-[17px] font-bold text-text">{title}</p>
      <p className="mx-auto mt-1.5 max-w-[260px] text-sm text-text-secondary">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** The RePark mark (assets/mark.svg): a plate outline with a P and a brand dot. Ink follows `currentColor`. */
export function Mark({ className = 'size-8', ring = 'var(--color-bg)' }: { className?: string; ring?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect x="6" y="15" width="52" height="36" rx="6" fill="none" stroke="currentColor" strokeWidth="4.5" />
      <path
        d="M24.5 44V24h7.2c4.4 0 7.3 2.4 7.3 6.3 0 3.9-2.9 6.3-7.3 6.3h-3.4V44z M28.3 33.4h3.2c2.2 0 3.6-1.1 3.6-3.1s-1.4-3.1-3.6-3.1h-3.2z"
        fill="currentColor"
      />
      <circle cx="55" cy="16" r="7" fill="var(--color-brand)" stroke={ring} strokeWidth="3" />
    </svg>
  );
}

/** Mark + wordmark. `light` is for brand-field backgrounds. */
export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 ${light ? 'text-white' : 'text-text'}`}>
      <Mark className="size-9" ring={light ? 'var(--color-field)' : 'var(--color-bg)'} />
      <span className="text-lg font-extrabold tracking-[-0.01em]">RePark</span>
    </span>
  );
}

/** List error (components.md): what failed, reassurance, and Try again. */
export function ListError({ list, onRetry }: { list: string; onRetry: () => void }) {
  return (
    <div role="alert" className="mb-4 flex flex-wrap items-center gap-3 rounded-card border border-line bg-surface p-4">
      <CircleAlert className="size-5 shrink-0 text-stop" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">We couldn’t load your {list}.</p>
        <p className="text-sm text-text-secondary">Check your connection. Nothing you’ve sent is lost.</p>
      </div>
      <Button variant="secondary" onClick={onRetry}>Try again</Button>
    </div>
  );
}
