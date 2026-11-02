import { Check, type LucideIcon } from 'lucide-react';

/**
 * done: brand fill + check. go: an owner reply. stop: incorrect report.
 * neutral: closed with no reply. waiting: owner not on RePark yet. pending: still to happen.
 */
export type TimelineState = 'done' | 'go' | 'stop' | 'neutral' | 'waiting' | 'pending';

export type TimelineStep = {
  title: string;
  /** Mono line under the title, e.g. "21:42:11 · delivered". */
  time?: string;
  /** Plain sentence under the title. */
  detail?: string;
  state: TimelineState;
  icon?: LucideIcon;
};

const NODE: Record<Exclude<TimelineState, 'pending'>, string> = {
  done:    'bg-brand text-on-brand',
  go:      'bg-go text-on-brand',
  stop:    'bg-stop text-on-stop',
  neutral: 'bg-surface-sunken text-text-secondary',
  waiting: 'bg-brand-tint text-brand',
};

const isDashed = (state: TimelineState) => state === 'pending' || state === 'waiting';

/**
 * Status timeline (components.md): 24 px rail, 20 px nodes, 2 px connectors. Solid brand
 * between done steps, go into a reply, dashed into anything pending. With `relay`, a signal
 * dot travels the first dashed segment once.
 */
export function Timeline({ steps, relay = false }: { steps: TimelineStep[]; relay?: boolean }) {
  const firstDashed = steps.findIndex((s, i) => i > 0 && isDashed(s.state)) - 1;
  return (
    <ol>
      {steps.map((step, i) => {
        const next = steps[i + 1];
        const Icon = step.icon ?? Check;
        return (
          <li key={`${i}-${step.title}`} className="flex gap-3.5">
            <div className="flex w-6 shrink-0 flex-col items-center">
              {step.state === 'pending' ? (
                <span className="mt-px size-5 rounded-full border-2 border-dashed border-line-strong" aria-hidden />
              ) : (
                <span className={`mt-px grid size-5 place-items-center rounded-full ${NODE[step.state]}`} aria-hidden>
                  <Icon className="size-3" strokeWidth={3} />
                </span>
              )}
              {next && (isDashed(next.state) ? (
                <span className="relative my-1 w-3 flex-1" aria-hidden>
                  <span className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-[repeating-linear-gradient(to_bottom,var(--color-line-strong)_0_4px,transparent_4px_8px)]" />
                  {relay && i === firstDashed && (
                    <span className="relay-down absolute left-0 size-3 rounded-full border-[3px] border-bg bg-signal" />
                  )}
                </span>
              ) : (
                <span
                  className={`my-1 w-0.5 flex-1 rounded ${
                    next.state === 'go' ? 'bg-go' : next.state === 'done' ? 'bg-brand' : 'bg-line-strong'
                  }`}
                  aria-hidden
                />
              ))}
            </div>
            <div className={`min-w-0 ${next ? 'pb-5' : ''}`}>
              <p
                className={`text-[15px] font-bold ${
                  step.state === 'go' ? 'text-go' : step.state === 'stop' ? 'text-stop' : 'text-text'
                }`}
              >
                {step.title}
              </p>
              {step.time && <p className="mt-0.5 font-mono text-xs font-medium text-text-muted">{step.time}</p>}
              {step.detail && <p className="mt-0.5 text-sm text-text-secondary">{step.detail}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
