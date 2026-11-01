'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { sendCodeErrorMessage, verifyCodeErrorMessage } from '@/lib/authErrors';
import { useAuth } from '@/components/AuthProvider';
import { Button, ErrorBanner, Field, inputClass } from '@/components/ui';

// Supabase allows one code per number every 60 seconds.
const RESEND_WAIT_SECONDS = 60;

/** Only allow redirects to pages on this site. */
function safeNext(next: string | null): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';
}

/** Why the visitor is being asked to sign in, based on where they're headed. */
function signInReason(next: string): React.ReactNode {
  const url = new URL(next, 'https://repark.invalid');
  switch (url.pathname) {
    case '/report': {
      // Set by links such as QR stickers: /report?plate=ABC123
      const plate = url.searchParams.get('plate')?.trim().toUpperCase().slice(0, 12);
      return plate
        ? <>Sign in to alert the owner of <strong className="font-semibold">{plate}</strong>.</>
        : 'Sign in to report a car that’s blocking you.';
    }
    case '/vehicles': return 'Sign in to register your car.';
    case '/alerts':   return 'Sign in to see alerts about your car.';
    default:          return null;
  }
}

export function LoginForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get('next'));
  const reason = signInReason(next);
  const { session, loading } = useAuth();

  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState<'send' | 'verify' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);

  // Already signed in (or just finished signing in): go on.
  useEffect(() => {
    if (!loading && session) router.replace(next);
  }, [loading, session, next, router]);

  // Count down until another code can be sent.
  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn(s => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  /** Text a code to `number`. Returns true if it was sent. */
  const requestCode = async (number: string) => {
    setBusy('send');
    setError(null);
    setNotice(null);
    const { error } = await supabase().auth.signInWithOtp({ phone: number });
    setBusy(null);
    if (error) {
      setError(sendCodeErrorMessage(error));
      return false;
    }
    setResendIn(RESEND_WAIT_SECONDS);
    return true;
  };

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalised = phone.replace(/[\s()-]/g, '');
    if (!/^\+\d{7,15}$/.test(normalised)) {
      setError('Enter your number in international format, starting with + and your country code, e.g. +1 234 567 8900.');
      return;
    }
    if (await requestCode(normalised)) {
      setPhone(normalised);
      setStep('code');
    }
  };

  const resendCode = async () => {
    setCode('');
    if (await requestCode(phone)) setNotice(`We sent a new code to ${phone}.`);
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy('verify');
    setError(null);
    setNotice(null);
    const { error } = await supabase().auth.verifyOtp({ phone, token: code.trim(), type: 'sms' });
    setBusy(null);
    if (error) {
      setError(verifyCodeErrorMessage(error));
      return;
    }
    // The session change triggers the redirect above.
  };

  const changeNumber = () => {
    setStep('phone');
    setCode('');
    setError(null);
    setNotice(null);
    setResendIn(0);
  };

  if (step === 'phone') {
    return (
      <form onSubmit={sendCode} className="space-y-5">
        {reason && (
          <p className="rounded-lg bg-brand-light px-4 py-3 text-sm text-brand">{reason}</p>
        )}
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
        <Button type="submit" loading={busy === 'send'} className="w-full">Send code</Button>
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
      {notice && (
        <p role="status" className="rounded-lg border border-emerald-200 bg-success-light px-4 py-3 text-sm text-success">
          {notice}
        </p>
      )}
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
      <Button type="submit" loading={busy === 'verify'} disabled={busy !== null} className="w-full">
        Verify and sign in
      </Button>
      <div className="flex flex-col items-center gap-3 text-sm font-medium">
        <button
          type="button"
          className="text-brand hover:underline disabled:cursor-not-allowed disabled:text-ink-muted disabled:no-underline"
          onClick={resendCode}
          disabled={busy !== null || resendIn > 0}
        >
          {resendIn > 0 ? `Didn’t get it? Send a new code in ${resendIn}s` : 'Didn’t get it? Send a new code'}
        </button>
        <button type="button" className="text-ink-secondary hover:underline" onClick={changeNumber}>
          Use a different number
        </button>
      </div>
    </form>
  );
}
