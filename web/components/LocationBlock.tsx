'use client';

import { LocateFixed, RefreshCw } from 'lucide-react';
import { Banner, Button } from './ui';

export type BrowserLocation =
  | { status: 'idle' | 'locating' }
  | { status: 'error'; message: string }
  | { status: 'ready'; latitude: number; longitude: number; accuracy: number };

// Above this, the browser probably guessed from Wi-Fi or IP rather than GPS.
export const APPROXIMATE_METRES = 500;

/**
 * Location confirmation (components.md). Precise: accuracy circle, "Accurate to 12 m".
 * Approximate (web): dashed accuracy ring, "Approximate · about 800 m" and a warning.
 * The location only checks the reporter is nearby; it's never shown to the owner.
 */
export function LocationBlock({ location, onLocate }: { location: BrowserLocation; onLocate: () => void }) {
  if (location.status === 'idle') {
    return (
      <div className="rounded-card border border-dashed border-line-strong p-5">
        <Button type="button" variant="secondary" icon={LocateFixed} onClick={onLocate}>
          Use my location
        </Button>
        <p className="mt-3 text-sm text-text-secondary">Used to check you’re near the car. It isn’t shown to the owner.</p>
      </div>
    );
  }

  if (location.status === 'error') {
    return (
      <div className="space-y-3">
        <Banner tone="error">{location.message}</Banner>
        <Button type="button" variant="quiet" icon={RefreshCw} onClick={onLocate}>Try again</Button>
      </div>
    );
  }

  const ready = location.status === 'ready';
  const approximate = ready && location.accuracy > APPROXIMATE_METRES;
  const metres = ready ? Math.round(location.accuracy) : 0;

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-card border border-line bg-surface">
        {/* Placeholder map tile */}
        <div
          aria-hidden
          className="relative grid h-24 place-items-center bg-surface-sunken bg-[linear-gradient(var(--color-line)_1px,transparent_1px),linear-gradient(90deg,var(--color-line)_1px,transparent_1px)] bg-[size:28px_28px]"
        >
          {ready && (
            <span
              className={`grid size-16 place-items-center rounded-full bg-brand-tint ${
                approximate ? 'border-2 border-dashed border-brand/50' : 'border-[1.5px] border-brand/35'
              }`}
            >
              <span className="size-3.5 rounded-full border-[2.5px] border-surface bg-brand" />
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 py-2.5 pl-4 pr-1.5">
          <LocateFixed className="size-5 shrink-0 text-brand" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="font-bold">{ready ? 'Your current location' : 'Finding your location'}</p>
            <p className="font-mono text-xs font-medium text-text-muted">
              {!ready
                ? 'Only used to check you’re nearby'
                : approximate
                  ? `Approximate · about ${metres >= 1000 ? `${(metres / 1000).toFixed(1)} km` : `${metres} m`}`
                  : `Accurate to ${metres} m · not shared`}
            </p>
          </div>
          <Button type="button" variant="quiet" onClick={onLocate} loading={!ready} loadingLabel="Locating" className="px-3">
            Refresh
          </Button>
        </div>
      </div>
      {approximate && (
        <Banner tone="warning">
          Your browser only shared an approximate location. Turn on precise location, or use the app.
        </Banner>
      )}
    </div>
  );
}
