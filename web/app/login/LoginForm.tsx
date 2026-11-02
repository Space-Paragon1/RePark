'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { sendCodeErrorMessage, verifyCodeErrorMessage } from '@/lib/authErrors';
import { formatPlateInput } from '@/lib/plate';
import { defaultCountry, maskPhone, toE164, type Country } from '@/lib/phone';
import { useAuth } from '@/components/AuthProvider';
import { CodeField, PhoneField } from '@/components/PhoneCodeFields';
import { Plate } from '@/components/Plate';
import { Banner, Button, Logo } from '@/components/ui';

// Supabase allows one code per number every 60 seconds.
const RESEND_WAIT_SECONDS = 60;

/** Only allow redirects to pages on this site. */
function safeNext(next: string | null): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';
}

/** The plate being reported, when sign-in came from the home page or a sticker. */
function plateFromNext(next: string): string | null {
  const url = new URL(next, 'https://repark.invalid');
  if (url.pathname !== '/report') return null;
  const plate = url.searchParams.get('plate');
  return plate ? formatPlateInput(plate).replace(/\s/g, '') || null : null;
}

/** Why the visitor is being asked to sign in, for destinations other than a report. */
function signInReason(next: string): string {
  switch (new URL(next, 'https://repark.invalid').pathname) {
    case '/report':   return 'Sign in to report a car that’s blocking you.';
    case '/vehicles': return 'Sign in to register your car.';
    case '/alerts':   return 'Sign in to see alerts about your car.';
    default:          return 'One phone number. No password, photo or username.';
  }
}

function formatCountdown(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

/** Sign-in (screens.md): a split card, phone step then code step. */
export function LoginForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get('next'));
  const plate = plateFromNext(next);
  const { session, loading } = useAuth();

  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [country, setCountry] = useState<Country>(() =>
    defaultCountry(typeof navigator !== 'undefined' ? navigator.language : undefined),
  );
  const [national, setNational] = useState('');
  const [phone, setPhone] = useState(''); // E.164, once a code was sent
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState<'send' | 'verify' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);

  const e164 = toE164(country, national);

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
    if (!e164) {
      setError('That number looks too short. Check it and try again.');
      return;
    }
    if (await requestCode(e164)) {
      setPhone(e164);
      setStep('code');
    }
  };

  const verify = async (token: string) => {
    setBusy('verify');
    setError(null);
    const { error } = await supabase().auth.verifyOtp({ phone, token, type: 'sms' });
    setBusy(null);
    if (error) setError(verifyCodeErrorMessage(error));
    // On success the session change triggers the redirect above.
  };

  const changeCode = (value: string) => {
    setCode(value);
    if (error) setError(null);
    // Paste or autofill fills all six; send straight away.
    if (value.length === 6 && busy === null) verify(value);
  };

  const changeNumber = () => {
    setStep('phone');
    setCode('');
    setError(null);
    setResendIn(0);
  };

  return (
    <div className="grid w-full max-w-4xl overflow-hidden bg-surface sm:rounded-card sm:border sm:border-line md:grid-cols-[300px_minmax(0,1fr)]">
      {/* Field-colour panel: the plate being reported, when there is one */}
      <div className="relative flex flex-col gap-6 bg-field px-6 pb-8 pt-6 text-white md:min-h-[520px] md:px-7">
        <Link href="/" aria-label="RePark home" className="w-fit">
          <Logo light />
        </Link>
        <div className="mt-auto">
          {plate ? (
            <>
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-white/80">Sign in to alert the owner of</p>
              <Plate plate={plate} size="M" className="mt-3 w-fit" />
              <p className="mt-4 text-sm text-white/85">We’ll bring you straight back to your report.</p>
            </>
          ) : (
            <p className="text-sm text-white/85">{signInReason(next)}</p>
          )}
        </div>
        <div className="kerb-stripe absolute inset-x-0 bottom-0 h-2" aria-hidden />
      </div>

      <div className="px-6 py-8 sm:px-10 sm:py-12">
        {step === 'phone' ? (
          <form onSubmit={sendCode} className="max-w-md" noValidate>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Step 1 of 2</p>
            <h1 className="mt-2 text-[30px] font-extrabold leading-tight tracking-[-0.02em]">What’s your phone number?</h1>
            <p className="mt-2 text-text-secondary">We’ll text you a 6-digit code. No password needed.</p>
            <label htmlFor="phone" className="mb-1.5 mt-7 block text-sm font-semibold">Phone number</label>
            <PhoneField
              id="phone"
              country={country}
              onCountryChange={c => { setCountry(c); setError(null); }}
              value={national}
              onChange={value => { setNational(value); setError(null); }}
              autoFocus
            />
            {error && <Banner tone="error" className="mt-4">{error}</Banner>}
            <Button type="submit" loading={busy === 'send'} loadingLabel="Sending" disabled={!e164} className="mt-5">
              Send code
            </Button>
            <p className="mt-5 text-[13px] text-text-muted">
              By continuing you agree to the{' '}
              <Link href="/terms" className="font-semibold text-brand hover:underline">Terms</Link> and{' '}
              <Link href="/privacy" className="font-semibold text-brand hover:underline">Privacy Policy</Link>.
            </p>
          </form>
        ) : (
          <div className="max-w-md">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Step 2 of 2</p>
            <h1 className="mt-2 text-[30px] font-extrabold leading-tight tracking-[-0.02em]">Enter the code</h1>
            <p className="mt-2 text-text-secondary">
              Sent to {maskPhone(phone, country)}.{resendIn <= 0 && ' You can ask for a new one now.'}
            </p>
            <div className="mt-7">
              <CodeField value={code} onChange={changeCode} error={error} disabled={busy === 'verify'} />
            </div>
            {busy === 'verify' && (
              <Button loading loadingLabel="Signing in" className="mt-5">Signing in</Button>
            )}
            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-semibold">
              {resendIn > 0 ? (
                <span className="font-mono text-xs font-medium text-text-muted">Resend in {formatCountdown(resendIn)}</span>
              ) : (
                <button
                  type="button"
                  className="text-brand hover:underline disabled:opacity-45"
                  disabled={busy !== null}
                  onClick={async () => { setCode(''); await requestCode(phone); }}
                >
                  Resend code
                </button>
              )}
              <button type="button" className="text-brand hover:underline" onClick={changeNumber}>
                Use a different number
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
