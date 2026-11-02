import type { Metadata } from 'next';
import { ContactForm } from '@/components/ContactForm';
import { PublicHeader, SiteFooter } from '@/components/SiteChrome';
import { Banner } from '@/components/ui';

export const metadata: Metadata = { title: 'Contact us' };

export default function ContactPage() {
  return (
    <div className="flex flex-1 flex-col">
      <PublicHeader />
      <main className="mx-auto grid w-full max-w-[1280px] flex-1 gap-10 px-5 py-12 sm:px-10 md:grid-cols-[minmax(0,1fr)_280px] lg:px-16">
        <div className="max-w-xl">
          <h1 className="text-[40px] font-extrabold leading-[44px] tracking-[-0.02em]">Contact us</h1>
          <p className="mb-8 mt-3 text-lg leading-7 text-text-secondary">
            We read every message. Tell us what happened and we’ll reply by email.
          </p>
          <ContactForm />
        </div>
        <aside className="space-y-4 md:pt-2">
          <Banner tone="warning">
            In an emergency, call your local emergency number. RePark isn’t monitored around the clock.
          </Banner>
          <p className="border-t border-line pt-4 text-sm text-text-secondary">
            We’ll never pass your details to the other person in a report.
          </p>
        </aside>
      </main>
      <SiteFooter />
    </div>
  );
}
