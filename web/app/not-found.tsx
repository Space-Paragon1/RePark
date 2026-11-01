import type { Metadata } from 'next';
import Link from 'next/link';
import { ButtonLink, Card, Logo } from '@/components/ui';

export const metadata: Metadata = { title: 'Page not found' };

/** Shown for any address that isn't a page on the site. Styled like the sign-in page. */
export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-field px-5 py-12">
      <Link href="/" className="mb-8">
        <Logo light />
      </Link>
      <Card className="w-full max-w-md p-7 text-center">
        <p className="text-sm font-semibold text-brand">404</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Page not found</h1>
        <p className="mt-2 text-text-secondary">
          This page doesn’t exist or has moved. Check the address, or head back to RePark.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <ButtonLink href="/">Go to the home page</ButtonLink>
          <ButtonLink href="/report" variant="secondary">Report a car</ButtonLink>
        </div>
      </Card>
    </main>
  );
}
