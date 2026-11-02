import Link from 'next/link';
import { Check, EyeOff, Plus } from 'lucide-react';
import { HeroPanel } from '@/components/home/HeroPanel';
import { HeroPlateForm } from '@/components/home/HeroPlateForm';
import { Plate } from '@/components/Plate';
import { SiteFooter } from '@/components/SiteChrome';
import { Timeline, type TimelineStep } from '@/components/Timeline';
import { ButtonLink, Logo } from '@/components/ui';

// Wording: design_handoff_repark_redesign/copy.md ("Website home").

const FACTS = [
  { title: 'Push, or a text', body: 'Owners without the app get a text message.' },
  { title: 'Reply in two taps', body: 'Moving now, Already moved or Incorrect report.' },
  { title: 'Closes in 24 hours', body: 'Every report ends with a clear outcome.' },
];

const MOMENTS: { time: string; title: string; body: string; state: 'done' | 'go' | 'pending' }[] = [
  { time: '21:42:08', title: 'You enter the plate', body: 'Type it, confirm where you are and pick the problem.', state: 'done' },
  { time: '21:42:11', title: 'We alert the owner', body: 'By push, or by text if they don’t use the app.', state: 'done' },
  { time: '21:44:30', title: 'The owner replies', body: 'Moving now, Already moved or Incorrect report.', state: 'go' },
  {
    time: 'or after 24 h',
    title: 'The report closes',
    body: 'If there’s no reply, it closes as No response. If the plate isn’t registered, the owner has 2 hours to join.',
    state: 'pending',
  },
];

const MOMENTS_PHONE: TimelineStep[] = [
  { title: 'You enter the plate', detail: 'Confirm where you are and pick the problem.', state: 'done' },
  { title: 'We alert the owner', detail: 'By push, or by text if they don’t use the app.', state: 'done' },
  { title: 'The owner replies', detail: 'Moving now, Already moved or Incorrect report.', state: 'go' },
  { title: 'Or the report closes', detail: 'After 24 hours with no reply.', state: 'pending' },
];

const OWNER_SEES = [
  { label: 'Plate, make, model and colour', example: '8KTR 214' },
  { label: 'The problem', example: 'Blocking driveway' },
  { label: 'When it was reported', example: '21:42' },
];

const REPORTER_SEES = [
  { label: 'That the owner was alerted', example: '21:42' },
  { label: 'The owner’s reply', example: 'Moving now' },
  { label: 'When they replied', example: '21:44' },
];

const kicker = 'font-mono text-xs font-semibold uppercase tracking-[0.14em] text-text-muted';
const sectionTitle = 'text-[32px] font-extrabold leading-[36px] tracking-[-0.02em] sm:text-[40px] sm:leading-[44px]';
const container = 'mx-auto w-full max-w-[1280px] px-5 sm:px-10 lg:px-16';

export default function HomePage() {
  const androidUrl = process.env.NEXT_PUBLIC_ANDROID_APP_URL;
  const iosUrl = process.env.NEXT_PUBLIC_IOS_APP_URL;

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-line">
        <div className={`${container} flex h-[72px] items-center gap-8`}>
          <Link href="/" aria-label="RePark home">
            <Logo />
          </Link>
          <nav aria-label="Sections" className="hidden flex-1 gap-6 text-sm font-semibold text-text-secondary md:flex">
            <a href="#how-it-works" className="hover:text-text">How it works</a>
            <a href="#privacy" className="hover:text-text">Privacy</a>
            <a href="#owners" className="hover:text-text">For car owners</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <ButtonLink href="/login" variant="quiet" className="h-10 px-3.5">Sign in</ButtonLink>
            <ButtonLink href="#get-the-app" variant="secondary" className="h-10 px-4 max-sm:hidden">Get the app</ButtonLink>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="grid min-[840px]:min-h-[680px] min-[840px]:grid-cols-[minmax(0,1fr)_minmax(0,560px)]">
        <div className="flex flex-col justify-center px-5 py-10 sm:px-10 min-[840px]:pb-16 min-[840px]:pl-16 min-[840px]:pr-14 min-[840px]:pt-22">
          <p className={kicker}>Anonymous parking alerts</p>
          <h1 className="mt-4 text-[40px] font-extrabold leading-[42px] tracking-[-0.035em] min-[840px]:text-[64px] min-[840px]:leading-[64px]">
            Blocked in?{' '}
            <span className="text-text-muted">
              Tell the owner in under a minute. Neither of you learns who the other is.
            </span>
          </h1>
          <div className="mt-10 max-w-xl">
            <HeroPlateForm />
          </div>
          <dl className="mt-10 grid gap-5 border-t border-line pt-6 sm:grid-cols-3">
            {FACTS.map(fact => (
              <div key={fact.title}>
                <dt className="text-sm font-bold">{fact.title}</dt>
                <dd className="mt-1 text-[13px] text-text-secondary">{fact.body}</dd>
              </div>
            ))}
          </dl>
        </div>
        <HeroPanel />
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-4 border-t border-line py-20">
        <div className={`${container} grid gap-10 lg:grid-cols-[320px_1fr] lg:gap-16`}>
          <div>
            <p className={kicker}>How it works</p>
            <h2 className={`mt-3 ${sectionTitle}`}>Four moments, each one visible to you.</h2>
          </div>
          <ol className="hidden grid-cols-4 md:grid">
            {MOMENTS.map((moment, i) => {
              const next = MOMENTS[i + 1];
              return (
                <li key={moment.title} className="pr-5">
                  <div className="flex items-center" aria-hidden>
                    {moment.state === 'pending' ? (
                      <span className="size-5 shrink-0 rounded-full border-2 border-dashed border-line-strong" />
                    ) : (
                      <span
                        className={`grid size-5 shrink-0 place-items-center rounded-full text-on-brand ${
                          moment.state === 'go' ? 'bg-go' : 'bg-brand'
                        }`}
                      >
                        <Check className="size-3" strokeWidth={3} />
                      </span>
                    )}
                    {next?.state === 'pending' || !next ? (
                      <span className="-mr-5 h-0.5 flex-1 bg-[repeating-linear-gradient(to_right,var(--color-line-strong)_0_6px,transparent_6px_10px)]" />
                    ) : (
                      <span className="-mr-5 h-0.5 flex-1 bg-brand" />
                    )}
                  </div>
                  <p className="mt-4 font-mono text-xs font-medium text-text-muted">{moment.time}</p>
                  <h3 className="mt-1.5 text-lg font-bold leading-snug">{moment.title}</h3>
                  <p className="mt-2 text-[15px] leading-6 text-text-secondary">{moment.body}</p>
                </li>
              );
            })}
          </ol>
          <div className="md:hidden">
            <Timeline steps={MOMENTS_PHONE} />
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section id="privacy" className="scroll-mt-4 border-t border-line py-20">
        <div className={`${container} grid gap-10 lg:grid-cols-[320px_1fr] lg:gap-16`}>
          <div>
            <p className={kicker}>Privacy</p>
            <h2 className={`mt-3 ${sectionTitle}`}>RePark stands in the middle.</h2>
            <p className="mt-4 text-text-secondary">
              Names, numbers and exact locations stay with us. Here is exactly what each side gets.
            </p>
          </div>
          <div className="grid gap-10 md:grid-cols-2">
            <SeesList title="The owner sees" rows={OWNER_SEES} never="Never: who reported it, their number, their note or where they were." />
            <SeesList title="The reporter sees" rows={REPORTER_SEES} never="Never: the owner’s name or number." />
          </div>
        </div>
      </section>

      {/* For car owners */}
      <section id="owners" className="scroll-mt-4 border-t border-line py-20">
        <div className={`${container} grid items-center gap-12 lg:grid-cols-2`}>
          <div className="order-2 space-y-3 lg:order-1" aria-hidden>
            <ExampleVehicle plate="8KTR 214" name="Silver Toyota Corolla" added="Added 3 Mar 2026" />
            <ExampleVehicle plate="5HDW 880" name="Blue Ford Transit" added="Added 19 Jun 2026" />
            <div className="flex items-center justify-center gap-2 rounded-card border border-dashed border-line-strong p-6 text-sm font-semibold text-text-secondary">
              <Plus className="size-4" /> Add a plate · up to 10
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <p className={kicker}>For car owners</p>
            <h2 className={`mt-3 ${sectionTitle}`}>Register your plates so people can reach you without a note on the windscreen.</h2>
            <p className="mt-4 text-[17px] leading-7 text-text-secondary">
              When someone’s blocked in by your car, you get a push, or a text if you don’t have the app. You reply
              in two taps and they see it straight away. They never learn who you are.
            </p>
            <ButtonLink href="/vehicles" variant="secondary" className="mt-6">Register a plate</ButtonLink>
          </div>
        </div>
      </section>

      {/* Get the app */}
      <section id="get-the-app" className="bg-inverse py-14 text-on-inverse">
        <div className={`${container} flex flex-wrap items-center justify-between gap-6`}>
          <div>
            <h2 className="text-[28px] font-extrabold leading-tight tracking-[-0.02em] sm:text-[32px]">Get RePark on your phone.</h2>
            <p className="mt-2 opacity-80">
              Alerts arrive as notifications, with Moving now and Already moved right on the lock screen.
            </p>
          </div>
          {iosUrl || androidUrl ? (
            <div className="flex flex-wrap gap-3">
              {iosUrl && <StoreLink href={iosUrl}>App Store</StoreLink>}
              {androidUrl && <StoreLink href={androidUrl}>Google Play</StoreLink>}
            </div>
          ) : (
            <p className="font-mono text-xs opacity-80">Coming soon to the App Store and Google Play.</p>
          )}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function SeesList({ title, rows, never }: { title: string; rows: { label: string; example: string }[]; never: string }) {
  return (
    <div>
      <h3 className="border-b-[1.5px] border-text pb-3 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-text-secondary">
        {title}
      </h3>
      <ul>
        {rows.map(row => (
          <li key={row.label} className="flex items-baseline justify-between gap-4 border-b border-line py-3">
            <span className="text-[15px] font-medium">{row.label}</span>
            <span className="shrink-0 font-mono text-xs text-text-muted">{row.example}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 flex gap-2 text-sm font-medium text-stop">
        <EyeOff className="mt-0.5 size-4 shrink-0" aria-hidden />
        {never}
      </p>
    </div>
  );
}

function ExampleVehicle({ plate, name, added }: { plate: string; name: string; added: string }) {
  return (
    <div className="flex items-center gap-5 rounded-card border border-line bg-surface p-4">
      <Plate plate={plate} size="M" />
      <div>
        <p className="font-semibold">{name}</p>
        <p className="mt-0.5 font-mono text-xs text-text-muted">{added}</p>
      </div>
    </div>
  );
}

function StoreLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="inline-flex h-12 items-center rounded-control border-[1.5px] border-on-inverse px-5 font-bold transition-colors hover:bg-on-inverse hover:text-inverse"
    >
      {children}
    </a>
  );
}
