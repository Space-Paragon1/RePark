'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Send, ShieldCheck } from 'lucide-react';
import { reportsApi, type IssueType, type Report } from '@/lib/api';
import { formatTime, isReportOpen, issueLabel, reportStatus } from '@/lib/labels';
import { formatPlateInput, isPlateValid, plateForSubmit } from '@/lib/plate';
import {
  NOTE_MAX, REPORTS_PER_HOUR, nextReportAt, noteError, reportErrorMessage, reportOutcome, reportTimeline,
  reportsThisHour,
} from '@/lib/report';
import { useAutoRefresh } from '@/lib/useAutoRefresh';
import { useLoad } from '@/lib/useLoad';
import { IssuePicker } from '@/components/IssuePicker';
import { LocationBlock, type BrowserLocation } from '@/components/LocationBlock';
import { Plate, PlateInput } from '@/components/Plate';
import { RelayGraphic } from '@/components/RelayGraphic';
import { ReportRow } from '@/components/ReportRow';
import { SkeletonRows } from '@/components/Skeleton';
import { Timeline, type TimelineStep } from '@/components/Timeline';
import { Button, Card, Chip, EmptyState, ErrorBanner, ListError, PageHeader, textareaClass } from '@/components/ui';

const LOCATION_ERRORS: Record<number, string> = {
  1: 'We need your location to send a report. Allow location for this site in your browser settings, then try again.',
  2: 'Your location isn’t available right now. Check that location services are on, then try again.',
  3: 'Finding your location took too long. Try again.',
};

// How often to check for an owner's reply while a report is still open.
const POLL_MS = 20_000;

const WHAT_HAPPENS_NEXT: TimelineStep[] = [
  { title: 'Report sent', detail: 'As soon as you press Send.', state: 'done' },
  { title: 'Owner alerted', detail: 'By push, or by text if they don’t have the app.', state: 'done' },
  { title: 'Owner replies', detail: 'Or the report closes after 24 hours.', state: 'pending' },
];

export function ReportView() {
  const searchParams = useSearchParams();
  const initialPlate = searchParams.get('plate') ?? '';
  // ?view=<id> opens a report's status, e.g. from the dashboard.
  const history = useLoad(reportsApi.list);
  const historyRef = useRef<HTMLElement>(null);
  // The report on show: just sent, or opened from the list. Read fresh from `history`.
  const [viewing, setViewing] = useState<{ id: string; justSent: boolean } | null>(() => {
    const id = searchParams.get('view');
    return id ? { id, justSent: false } : null;
  });
  const [formKey, setFormKey] = useState(0);

  // Reports are open until the owner replies or they close automatically.
  const waiting = !!history.data?.some(isReportOpen);
  useAutoRefresh(history.reload, { polling: waiting || !!viewing, everyMs: POLL_MS });

  const viewed = viewing ? history.data?.find(r => r.id === viewing.id) : undefined;
  const reports = history.data
    ?.slice()
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));

  return (
    <>
      <PageHeader title="Report a car" subtitle="The owner is alerted anonymously. They never see who you are." />

      {viewing && viewed ? (
        <StatusPanel
          report={viewed}
          justSent={viewing.justSent}
          onDone={() => {
            setViewing(null);
            setFormKey(k => k + 1);
          }}
          onSeeAll={() => {
            setViewing(null);
            historyRef.current?.scrollIntoView({ behavior: 'smooth' });
          }}
        />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <ReportForm
            key={formKey}
            initialPlate={initialPlate}
            history={history.data ?? []}
            onSubmitted={report => {
              history.setData(prev => [report, ...(prev ?? [])]);
              setViewing({ id: report.id, justSent: true });
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <Card>
              <h2 className="mb-4 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">What happens next</h2>
              <Timeline steps={WHAT_HAPPENS_NEXT} />
            </Card>
            <Card className="flex gap-3">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-text-secondary" aria-hidden />
              <p className="text-sm text-text-secondary">
                The owner sees the plate, the car and the problem. Never you, your number, your note or where you are.
              </p>
            </Card>
            <ul className="space-y-1 px-1 font-mono text-xs font-medium text-text-muted">
              <li>Up to {REPORTS_PER_HOUR} reports an hour.</li>
              <li>The same plate can be reported again after 15 minutes.</li>
            </ul>
          </aside>
        </div>
      )}

      <section ref={historyRef} className="mt-12 scroll-mt-24" aria-labelledby="your-reports">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 id="your-reports" className="text-xl font-extrabold tracking-[-0.01em]">Your reports</h2>
          {waiting && <p className="font-mono text-xs text-text-muted">Updates automatically while this page is open</p>}
        </div>
        {history.error && !history.data && <ListError list="reports" onRetry={history.reload} />}
        {history.loading && <SkeletonRows />}
        {reports?.length === 0 && (
          <EmptyState
            icon={Send}
            title="No reports yet"
            body="If a car’s blocking you, enter its plate and we’ll let the owner know."
          />
        )}
        {!!reports?.length && (
          <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
            {reports.map(report => (
              <li key={report.id}>
                <ReportRow
                  report={report}
                  onOpen={() => {
                    setViewing({ id: report.id, justSent: false });
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={`report-step-${n}`}>
      <h2 id={`report-step-${n}`} className="mb-3 flex items-center gap-3 text-lg font-bold">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-tint font-mono text-sm font-semibold text-brand">
          {n}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function ReportForm({ initialPlate, history, onSubmitted }: {
  initialPlate: string;
  history: Report[];
  onSubmitted: (report: Report) => void;
}) {
  const [plate, setPlate] = useState(formatPlateInput(initialPlate));
  const [plateError, setPlateError] = useState<string | null>(null);
  const [location, setLocation] = useState<BrowserLocation>({ status: 'idle' });
  const [issueType, setIssueType] = useState<IssueType | null>(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const noteProblem = noteError(message);
  const limitAt = nextReportAt(history);
  const usedThisHour = reportsThisHour(history).length;

  const findLocation = () => {
    if (!('geolocation' in navigator)) {
      setLocation({ status: 'error', message: 'This browser can’t share your location. Try a different browser or the RePark app.' });
      return;
    }
    setLocation({ status: 'locating' });
    navigator.geolocation.getCurrentPosition(
      pos => setLocation({
        status: 'ready',
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      }),
      err => setLocation({ status: 'error', message: LOCATION_ERRORS[err.code] ?? 'We couldn’t get your location. Try again.' }),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  // If location is already allowed for this site, find it straight away.
  useEffect(() => {
    navigator.permissions?.query({ name: 'geolocation' })
      .then(result => { if (result.state === 'granted') findLocation(); })
      .catch(() => {});
    // Runs once on mount; findLocation only sets state.
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPlateValid(plate)) {
      setPlateError('Enter 2 to 10 letters and numbers.');
      document.getElementById('report-plate')?.focus();
      return;
    }
    if (location.status !== 'ready') return setError('Confirm where you are before sending the report.');
    if (!issueType) return setError('Choose what the problem is.');
    if (noteProblem) return;

    setSubmitting(true);
    setError(null);
    try {
      const report = await reportsApi.create({
        plate_number: plateForSubmit(plate),
        latitude: location.latitude,
        longitude: location.longitude,
        issue_type: issueType,
        message: message.trim() || undefined,
      });
      onSubmitted(report);
    } catch (e) {
      setError(reportErrorMessage(e, history, plateForSubmit(plate)));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-10" noValidate>
      <Section n={1} title="Which car is blocking you?">
        <PlateInput
          id="report-plate"
          value={plate}
          onChange={value => { setPlate(value); setPlateError(null); }}
          error={plateError}
          className="max-w-md"
        />
        {!plateError && <p className="mt-2 text-[13px] text-text-muted">Letters and numbers only. Spaces don’t matter.</p>}
      </Section>

      <Section n={2} title="Where are you?">
        <LocationBlock location={location} onLocate={findLocation} />
      </Section>

      <Section n={3} title="What’s the problem?">
        <IssuePicker value={issueType} onChange={setIssueType} />
      </Section>

      <Section n={4} title="Check and send">
        <label htmlFor="report-note" className="mb-1.5 block text-sm font-semibold">
          Note <span className="font-normal text-text-muted">optional</span>
        </label>
        <textarea
          id="report-note"
          className={textareaClass}
          value={message}
          onChange={e => setMessage(e.target.value)}
          maxLength={NOTE_MAX}
          placeholder="For example, which gate is blocked"
          aria-invalid={!!noteProblem}
          aria-describedby="report-note-hint"
        />
        <div className="mt-1.5 flex justify-between gap-4 text-[13px]">
          <span id="report-note-hint" className={noteProblem ? 'font-medium text-stop' : 'text-text-muted'}>
            {noteProblem ?? 'Kept with your report. No names or numbers.'}
          </span>
          <span className="font-mono text-xs text-text-muted">{message.length}/{NOTE_MAX}</span>
        </div>

        <div className="mt-6">
          <ErrorBanner message={error} />
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Button
              type="submit"
              icon={Send}
              loading={submitting}
              loadingLabel="Sending"
              disabled={!!noteProblem || !!limitAt}
              className="w-full sm:w-auto sm:px-8"
            >
              Send alert
            </Button>
            <span className="font-mono text-xs font-medium text-text-muted">
              {limitAt
                ? `You can send another report at ${formatTime(limitAt.toISOString())}.`
                : `${Math.min(usedThisHour + 1, REPORTS_PER_HOUR)} of ${REPORTS_PER_HOUR} reports this hour`}
            </span>
          </div>
        </div>
      </Section>
    </form>
  );
}

/** After sending, or opened from the list: where the report stands. */
function StatusPanel({ report, justSent, onDone, onSeeAll }: {
  report: Report;
  justSent: boolean;
  onDone: () => void;
  onSeeAll: () => void;
}) {
  const outcome = reportOutcome(report);
  return (
    <Card className="mx-auto max-w-xl p-6 sm:p-8">
      {justSent && report.owner_notified && (
        <div className="mb-8">
          <RelayGraphic plate={report.plate_number} />
        </div>
      )}
      <Chip status={reportStatus(report)} />
      <h2 className="mt-3 text-[26px] font-extrabold leading-tight tracking-[-0.02em]">{outcome.title}</h2>
      <p className="mt-2 text-text-secondary">{outcome.body}</p>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Plate plate={report.plate_number} size="M" />
        <span className="font-semibold">{issueLabel(report.issue_type)}</span>
      </div>
      <div className="mt-6 border-t border-line pt-6">
        <Timeline steps={reportTimeline(report)} relay={justSent} />
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button variant="secondary" onClick={onDone}>Done</Button>
        <Button variant="quiet" onClick={onSeeAll}>See all reports</Button>
      </div>
    </Card>
  );
}
