import type { Metadata } from 'next';
import { PublicHeader } from '@/components/SiteChrome';
import { ButtonLink } from '@/components/ui';

export const metadata: Metadata = { title: 'Page not found' };

/** Any address that isn't a page: a blank plate reading 404, and the kerb stripe used once. */
export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col">
      <PublicHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-5 py-16 sm:px-10">
        <span
          aria-hidden
          className="grid h-20 w-64 place-items-center rounded-control border-2 border-dashed border-line-strong font-mono text-[40px] font-semibold tracking-[0.12em] text-text-muted"
        >
          404
        </span>
        <h1 className="mt-6 text-[40px] font-extrabold leading-[44px] tracking-[-0.02em] sm:text-5xl">Nothing parked here.</h1>
        <p className="mt-4 max-w-lg text-lg leading-7 text-text-secondary">
          The link may be old, or the address has a typo. If you scanned a sticker, try entering the plate yourself.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/report">Report a car</ButtonLink>
          <ButtonLink href="/" variant="secondary">Go to the home page</ButtonLink>
        </div>
      </main>
      <div className="kerb-stripe h-2" aria-hidden />
    </div>
  );
}
