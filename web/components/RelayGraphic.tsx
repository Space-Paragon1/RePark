import { User } from 'lucide-react';
import { Plate } from './Plate';

/** Sent relay: you → RePark → the plate. A signal dot travels the dashed path once. */
export function RelayGraphic({ plate }: { plate: string }) {
  const dashes = 'h-0.5 flex-1 bg-[repeating-linear-gradient(to_right,var(--color-line-strong)_0_6px,transparent_6px_12px)]';
  return (
    <div className="flex items-start gap-3" role="img" aria-label={`Sent from you, through RePark, to ${plate}`}>
      <div className="flex flex-col items-center gap-1.5">
        <span className="grid size-11 place-items-center rounded-full border border-line bg-surface">
          <User className="size-5 text-text-secondary" aria-hidden />
        </span>
        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-text-muted">You</span>
      </div>
      <div className="relative flex h-11 flex-1 items-center gap-2">
        <span className={dashes} />
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand text-xl font-extrabold text-on-brand">P</span>
        <span className={dashes} />
        <span className="relay-across absolute top-4 size-3 rounded-full border-[3px] border-bg bg-signal" aria-hidden />
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <Plate plate={plate} />
        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-text-muted">Owner</span>
      </div>
    </div>
  );
}
