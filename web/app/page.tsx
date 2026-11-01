import Link from 'next/link';
import { ButtonLink, Logo } from '@/components/ui';
import { CheckIcon } from '@/components/icons';

const STEPS = [
  {
    title: 'Enter the plate',
    body: 'Type the plate of the car that is blocking you and confirm where you are.',
  },
  {
    title: 'We alert the owner',
    body: 'If the car is registered, the owner gets a push notification or a text right away.',
  },
  {
    title: 'See their response',
    body: 'Follow the status as the owner replies "moving now" or "already moved".',
  },
];

const PRIVACY_POINTS = [
  'The owner never sees who reported their car.',
  'You never see the owner’s name or phone number.',
  'All messages go through RePark, never directly between people.',
  'Rate limits and abuse checks stop spam and harassment.',
];

export default function HomePage() {
  const androidUrl = process.env.NEXT_PUBLIC_ANDROID_APP_URL;
  const iosUrl = process.env.NEXT_PUBLIC_IOS_APP_URL;

  return (
    <div className="flex flex-1 flex-col">
      {/* Hero */}
      <section className="bg-brand text-white">
        <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <Logo light />
          <Link
            href="/login"
            className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20"
          >
            Sign in
          </Link>
        </header>

        <div className="mx-auto max-w-6xl px-5 pb-20 pt-10 sm:pt-16">
          <p className="mb-4 inline-block rounded-full bg-white/10 px-3 py-1 text-sm font-medium">
            No app needed — works in your browser
          </p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Someone blocking you in? Ask them to move — without swapping numbers.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-blue-50">
            RePark sends the vehicle owner an anonymous alert so they can come and repark their car.
            Your identity and theirs stay private.
          </p>
          {/* Full-width and stacked on phones, side by side from tablet size up */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/report" variant="secondary" className="px-6 py-3 text-base">
              Notify a car owner
            </ButtonLink>
            <Link
              href="/vehicles"
              className="inline-flex items-center justify-center rounded-lg border border-white/40 px-6 py-3 text-base font-semibold hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Register my car
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto w-full max-w-6xl px-5 py-16">
        <h2 className="text-2xl font-bold tracking-tight">How it works</h2>
        <ol className="mt-8 grid gap-5 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="rounded-2xl border border-line bg-white p-6 shadow-sm">
              <span className="grid size-9 place-items-center rounded-full bg-brand-light font-bold text-brand">
                {i + 1}
              </span>
              <h3 className="mt-4 font-semibold">{step.title}</h3>
              <p className="mt-1 text-ink-secondary">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Privacy */}
      <section className="border-y border-line bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Private by design</h2>
            <p className="mt-3 text-ink-secondary">
              RePark is a go-between. It gets the message to the right person without either side
              learning who the other is.
            </p>
          </div>
          <ul className="space-y-3">
            {PRIVACY_POINTS.map(point => (
              <li key={point} className="flex gap-3">
                <CheckIcon className="mt-0.5 size-5 shrink-0 text-success" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Owners */}
      <section className="mx-auto w-full max-w-6xl px-5 py-16">
        <div className="rounded-2xl bg-brand-light p-8 sm:p-10">
          <h2 className="text-2xl font-bold tracking-tight">Own a car? Register it.</h2>
          <p className="mt-2 max-w-2xl text-ink-secondary">
            Registered owners get told when their car is in the way, before it gets ticketed or towed.
            Sign in with your phone number, add your plate, and you’re set. Alerts arrive by text if
            you don’t use the app.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href="/vehicles">Register my car</ButtonLink>
            {androidUrl && <ButtonLink href={androidUrl} variant="secondary">Get the Android app</ButtonLink>}
            {iosUrl && <ButtonLink href={iosUrl} variant="secondary">Get the iPhone app</ButtonLink>}
          </div>
        </div>
      </section>

      <footer className="mt-auto border-t border-line bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-6 text-sm text-ink-secondary">
          <Logo />
          <span>Anonymous alerts for blocked driveways, loading zones and emergency access.</span>
        </div>
      </footer>
    </div>
  );
}
