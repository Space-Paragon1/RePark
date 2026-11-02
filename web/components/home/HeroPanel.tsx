import { Bell, Car, House, Send, TriangleAlert, type LucideIcon } from 'lucide-react';
import { Plate } from '@/components/Plate';

/**
 * Hero right panel (screens.md): field colour, a phone showing the owner's alert, and
 * three floating cards joined by a dashed relay path. Below 840 px it becomes a vertical
 * status strip. Decorative: the same story is told in text on the page.
 */
export function HeroPanel() {
  return (
    <div className="relative overflow-hidden bg-field pb-2">
      <p className="sr-only">
        Example: a report is sent at 21:42:08, the owner is alerted by push at 21:42:11, and replies
        Moving now at 21:44:30.
      </p>

      {/* Desktop: phone and floating cards */}
      <div aria-hidden className="relative hidden min-h-[680px] items-center justify-center min-[840px]:flex">
        <svg className="pointer-events-none absolute inset-0 size-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path
            d="M 22 19 C 50 22, 70 34, 82 47 S 55 74, 24 80"
            fill="none"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="2"
            strokeDasharray="6 8"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <PhoneMock />
        <FloatCard className="left-[5%] top-[13%]" icon={Send} title="Report sent" meta="21:42:08 · 8KTR 214" />
        <FloatCard className="right-[3%] top-[42%]" icon={Bell} title="Owner alerted by push" meta="21:42:11 · delivered" />
        <FloatCard className="bottom-[13%] left-[5%]" icon={Car} tone="go" title="Owner replied: Moving now" meta="21:44:30" />
      </div>

      {/* Phone widths: a vertical status strip */}
      <div aria-hidden className="px-4 py-6 min-[840px]:hidden">
        <FloatCard icon={Bell} title="Owner alerted by push" meta="21:42:11 · delivered" className="static w-auto max-w-[17rem]" />
        <div className="ml-7 h-8 w-0.5 bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,0.5)_0_4px,transparent_4px_8px)]" />
        <FloatCard icon={Car} tone="go" title="Owner replied: Moving now" meta="21:44:30" className="static ml-auto w-auto max-w-[17rem]" />
      </div>

      <div className="kerb-stripe absolute inset-x-0 bottom-0 h-2" aria-hidden />
    </div>
  );
}

function FloatCard({ icon: Icon, title, meta, tone = 'brand', className = '' }: {
  icon: LucideIcon;
  title: string;
  meta: string;
  tone?: 'brand' | 'go';
  className?: string;
}) {
  return (
    <div className={`absolute z-10 flex w-[232px] items-start gap-2.5 rounded-xl bg-surface px-3.5 py-3 text-text shadow-e1 ${className}`}>
      <span
        className={`grid size-8 shrink-0 place-items-center rounded-full ${tone === 'go' ? 'bg-go-tint text-go' : 'bg-brand-tint text-brand'}`}
      >
        <Icon className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-[13px] font-bold leading-tight">{title}</span>
        <span className="mt-0.5 block font-mono text-[11px] text-text-muted">{meta}</span>
      </span>
    </div>
  );
}

/** A 280 × 580 phone showing the owner alert screen. */
function PhoneMock() {
  return (
    <div className="relative h-[580px] w-[280px] overflow-hidden rounded-[46px] border-[10px] border-[#0D1117] bg-bg shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
      <div className="flex items-center justify-between px-6 pt-3 text-[13px] font-semibold">
        <span>21:42</span>
        <span className="h-6 w-24 rounded-full bg-[#0D1117]" />
        <span className="h-3 w-6 rounded-sm border border-current opacity-70" />
      </div>
      <div className="kerb-stripe mt-3 h-1.5" />
      <div className="flex h-[calc(100%-62px)] flex-col px-4 pb-5 pt-4">
        <span className="inline-flex h-6 w-fit items-center gap-1 rounded-[5px] bg-signal px-2 text-[11px] font-bold text-on-signal">
          <TriangleAlert className="size-3" strokeWidth={2.4} /> Needs your reply
        </span>
        <p className="mt-2 text-[19px] font-extrabold leading-6 tracking-[-0.01em]">Someone’s blocked in by your car.</p>
        <Plate plate="8KTR 214" size="M" className="mt-3 w-full" />
        <p className="mt-3 text-[13px] font-semibold">Silver Toyota Corolla</p>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-text-secondary">
          <House className="size-3.5" /> Blocking driveway or access
        </p>
        <p className="mt-2 font-mono text-[10px] text-text-muted">Reported 21:42 · Push 21:42</p>
        <div className="mt-auto space-y-2">
          <span className="grid h-10 place-items-center rounded-control bg-brand text-[13px] font-bold text-on-brand">Moving now</span>
          <span className="grid h-10 place-items-center rounded-control border-[1.5px] border-text text-[13px] font-bold">Already moved</span>
          <span className="grid h-8 place-items-center text-[13px] font-bold text-stop">Incorrect report</span>
        </div>
      </div>
    </div>
  );
}
