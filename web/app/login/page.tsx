import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Spinner } from '@/components/ui';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-start justify-center bg-surface sm:items-center sm:bg-bg sm:p-8">
      {/* LoginForm reads ?next= from the URL, so it renders in the browser. */}
      <Suspense fallback={<div className="grid h-56 place-items-center text-brand"><Spinner className="size-6" /></div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
