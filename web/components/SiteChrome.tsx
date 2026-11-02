import Link from 'next/link';
import { ButtonLink, Logo } from './ui';

const container = 'mx-auto w-full max-w-[1280px] px-5 sm:px-10 lg:px-16';

/** Header for public pages (privacy, terms, contact, 404): logo and Sign in. */
export function PublicHeader() {
  return (
    <header className="border-b border-line">
      <div className={`${container} flex h-16 items-center justify-between`}>
        <Link href="/" aria-label="RePark home">
          <Logo />
        </Link>
        <ButtonLink href="/login" variant="quiet" className="h-10 px-3.5">Sign in</ButtonLink>
      </div>
    </header>
  );
}

/** Site footer: logo, Privacy, Terms, Contact. */
export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className={`${container} flex min-h-22 flex-wrap items-center justify-between gap-4 py-6`}>
        <Logo />
        <nav aria-label="Footer" className="flex flex-wrap items-center gap-6 text-sm text-text-secondary">
          <Link href="/privacy" className="hover:text-text">Privacy</Link>
          <Link href="/terms" className="hover:text-text">Terms</Link>
          <Link href="/contact" className="hover:text-text">Contact</Link>
          <span className="font-mono text-xs text-text-muted">© 2026 RePark</span>
        </nav>
      </div>
    </footer>
  );
}

export type LegalSection = { id: string; title: string; body: React.ReactNode };

/** Privacy and Terms: "On this page" list on the left, sections on the right. */
export function LegalPage({ title, intro, updated, sections }: {
  title: string;
  intro: string;
  updated: string;
  sections: LegalSection[];
}) {
  return (
    <div className="flex flex-1 flex-col">
      <PublicHeader />
      <main className={`${container} grid flex-1 gap-10 py-12 md:grid-cols-[200px_minmax(0,1fr)] md:gap-16`}>
        <nav aria-label="On this page" className="md:sticky md:top-8 md:self-start">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">On this page</p>
          <ul className="mt-3 space-y-2.5 border-l border-line pl-3 text-sm">
            {sections.map(section => (
              <li key={section.id}>
                <a href={`#${section.id}`} className="text-text-secondary hover:text-text">{section.title}</a>
              </li>
            ))}
          </ul>
        </nav>
        <article className="max-w-2xl">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Last updated · {updated}</p>
          <h1 className="mt-3 text-[40px] font-extrabold leading-[44px] tracking-[-0.02em]">{title}</h1>
          <p className="mt-4 text-lg leading-7 text-text-secondary">{intro}</p>
          {sections.map(section => (
            <section key={section.id} id={section.id} className="mt-8 scroll-mt-8 border-t border-line pt-8">
              <h2 className="text-xl font-bold">{section.title}</h2>
              <div className="mt-3 space-y-3 leading-7 text-text-secondary">{section.body}</div>
            </section>
          ))}
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
