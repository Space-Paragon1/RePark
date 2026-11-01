'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { Button, ErrorBanner, Field, inputClass } from '@/components/ui';

/** Only allow redirects to pages on this site. */
function safeNext(next: string | null): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';
}

export function LoginForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get('next'));
  const { session, loading } = useAuth();

  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already signed in (or just finished signing in): go on.
  useEffect(() => {
    if (!loading && session) router.replace(next);
  }, [loading, session, next, router]);

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalised = phone.replace(/[\s()-]/g, '');
    if (!/^\+\d{7,15}$/.test(normalised)) {
      setError('Enter your number in international format, starting with + and your country code, e.g. +1 234 567 8900.');
      return;
    }
    setBusy(true);
    setError(null);
    const { error } = await supabase().auth.signInWithOtp({ phone: normalised });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setPhone(normalised);
    setStep('code');
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase().auth.verifyOtp({ phone, token: code.trim(), type: 'sms' });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    // The session change triggers the redirect above.
  };

  if (step === 'phone') {
    return (
      <form onSubmit={sendCode} className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sign in</h1>
          <p className="mt-1 text-ink-secondary">We’ll text you a one-time code. No password needed.</p>
        </div>
        <ErrorBanner message={error} />
        <Field label="Phone number" hint="Include your country code, e.g. +44 or +1">
          <input
            className={inputClass}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+1 234 567 8900"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            autoFocus
            required
          />
        </Field>
        <Button type="submit" loading={busy} className="w-full">Send code</Button>
      </form>
    );
  }

  return (
    <form onSubmit={verifyCode} className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Enter your code</h1>
        <p className="mt-1 text-ink-secondary">We sent a 6-digit code to {phone}.</p>
      </div>
      <ErrorBanner message={error} />
      <Field label="Code">
        <input
          className={`${inputClass} tracking-[0.4em]`}
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          placeholder="123456"
          value={code}
          onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
          autoFocus
          required
        />
      </Field>
      <Button type="submit" loading={busy} className="w-full">Verify and sign in</Button>
      <button
        type="button"
        className="w-full text-center text-sm font-medium text-brand hover:underline"
        onClick={() => { setStep('phone'); setCode(''); setError(null); }}
      >
        Use a different number
      </button>
    </form>
  );
}
