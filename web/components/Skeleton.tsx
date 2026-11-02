/** Loading rows that copy the real ones: a plate-shaped bone first, then two text bones. */
export function SkeletonRows({ count = 3, card = true }: { count?: number; card?: boolean }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={card ? 'divide-y divide-line overflow-hidden rounded-card border border-line bg-surface' : 'space-y-3'}
    >
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={`flex items-center gap-3 p-3.5 ${card ? '' : 'rounded-card border border-line bg-surface'}`}>
          <span className="skeleton-bone h-7 w-[92px] shrink-0 rounded-plate-sm border-[1.5px] border-line" />
          <span className="flex-1 space-y-2">
            <span className="skeleton-bone block h-3 w-1/2 rounded" />
            <span className="skeleton-bone block h-2.5 w-1/4 rounded" />
          </span>
        </div>
      ))}
    </div>
  );
}
