import type { Metadata } from 'next';
import { LegalPage } from '@/components/SiteChrome';

export const metadata: Metadata = { title: 'Terms' };

// Draft written from how RePark works today. Have it reviewed before relying on it.
export default function TermsPage() {
  return (
    <LegalPage
      title="Terms"
      updated="Draft"
      intro="The rules for using RePark, written to be read."
      sections={[
        {
          id: 'using-repark',
          title: 'Using RePark',
          body: (
            <>
              <p>
                RePark lets you alert the owner of a car that’s blocking you, without either of you learning who the other is.
              </p>
              <p>
                Use it only for real parking problems you’re facing. Don’t use it to harass anyone or to find out who owns a
                car. RePark isn’t an emergency service: in an emergency, call your local emergency number.
              </p>
            </>
          ),
        },
        {
          id: 'reports-and-limits',
          title: 'Reports and limits',
          body: (
            <>
              <p>You can send up to 3 reports an hour, and report the same plate again after 15 minutes.</p>
              <p>You share your location when you report, so we can check you’re near the car. The owner never sees it.</p>
              <p>A report closes after 24 hours if the owner doesn’t reply.</p>
            </>
          ),
        },
        {
          id: 'incorrect-reports',
          title: 'Incorrect reports',
          body: (
            <p>
              Owners can mark a report as incorrect if their car wasn’t there or wasn’t in the way. Incorrect reports count
              against the person who sent them. After several in a day, reporting is paused for that account for up to 24 hours.
            </p>
          ),
        },
        {
          id: 'your-account',
          title: 'Your account',
          body: (
            <>
              <p>Your phone number is your account, so keep your phone secure.</p>
              <p>
                Register only cars you own or use. If a plate is registered to another account and it’s yours, file an
                ownership claim. We review each claim by hand, and the other account isn’t told who you are.
              </p>
              <p>You can delete your account at any time from Account.</p>
            </>
          ),
        },
        {
          id: 'changes',
          title: 'Changes to these terms',
          body: <p>When the rules change, we’ll update this page and the date at the top.</p>,
        },
      ]}
    />
  );
}
