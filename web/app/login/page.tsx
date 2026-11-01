import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { Card, Logo, Spinner } from '@/components/ui';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-brand px-5 py-12">
      <Link href="/" className="mb-8">
        <Logo light />
      </Link>
      <Card className="w-full max-w-md p-7">
        {/* LoginForm reads ?next= from the URL, so it renders in the browser. */}
        <Suspense fallback={<div className="grid h-56 place-items-center text-brand"><Spinner /></div>}>
          <LoginForm />
        </Suspense>
      </Card>
      <p className="mt-6 max-w-md text-center text-sm text-blue-100">
        Your phone number is only used to sign you in and to alert you about your own car.
        It’s never shown to anyone.
      </p>
    </main>
  );
}
