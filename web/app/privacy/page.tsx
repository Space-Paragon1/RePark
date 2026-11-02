import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage } from '@/components/SiteChrome';

export const metadata: Metadata = { title: 'Privacy' };

// Draft written from how RePark works today. Have it reviewed before relying on it.
export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy"
      updated="Draft"
      intro="RePark passes a message between two people without telling either who the other is. This page explains what we keep and why."
      sections={[
        {
          id: 'what-we-collect',
          title: 'What we collect',
          body: (
            <ul className="list-disc space-y-2 pl-5">
              <li>Your phone number, to sign you in with a text code, and to text you about your cars if you don’t use the app.</li>
              <li>The plates you register, with make, model, colour and, if you add it, where you usually park.</li>
              <li>Reports you send: the plate, the problem, an optional note, and where you were. Your location is used to check you’re near the car.</li>
              <li>Your replies to alerts about your cars.</li>
              <li>A notification token if you allow notifications in the app, so alerts reach your phone.</li>
              <li>A record of reports marked incorrect and of reaching the report limits, to stop misuse.</li>
            </ul>
          ),
        },
        {
          id: 'what-each-person-sees',
          title: 'What each person sees',
          body: (
            <>
              <p>
                The owner sees the plate, make, model and colour, the problem, and when it was reported. They never see who
                reported it, that person’s number, their note or where they were.
              </p>
              <p>
                The reporter sees whether the owner was alerted, the owner’s reply and when it came. They never see the
                owner’s name or number.
              </p>
            </>
          ),
        },
        {
          id: 'how-long-we-keep-it',
          title: 'How long we keep it',
          body: (
            <>
              <p>Your vehicles, reports and alerts stay in your account until you remove them or delete your account.</p>
              <p>
                A report closes after 24 hours without a reply, or after 2 hours if the plate isn’t registered. Closed reports
                stay in your history.
              </p>
              <p>Deleting your account removes your phone number, your vehicles, your reports and your alerts.</p>
            </>
          ),
        },
        {
          id: 'your-choices',
          title: 'Your choices',
          body: (
            <ul className="list-disc space-y-2 pl-5">
              <li>Download a copy of your vehicles, reports and alerts from Account.</li>
              <li>Remove a vehicle at any time. You’ll stop getting alerts for it.</li>
              <li>Turn notifications off in your phone’s settings. If you do, alerts about your cars may come by text instead.</li>
              <li>Delete your account from Account.</li>
            </ul>
          ),
        },
        {
          id: 'contact',
          title: 'Contact',
          body: (
            <p>
              Questions about your data? <Link href="/contact" className="font-semibold text-brand hover:underline">Contact us</Link>.
            </p>
          ),
        },
      ]}
    />
  );
}
