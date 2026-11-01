'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { reportsApi, type IssueType, type Report } from '@/lib/api';
import { ISSUE_TYPES, formatDateTime, issueLabel, reportStatus } from '@/lib/labels';
import { useAutoRefresh } from '@/lib/useAutoRefresh';
import { useLoad } from '@/lib/useLoad';
import {
  Badge, Button, Card, EmptyState, ErrorBanner, Field, PageHeader, Spinner, inputClass,
} from '@/components/ui';
import { CheckIcon, ClockIcon } from '@/components/icons';

type Location = { latitude: number; longitude: number; accuracy: number };

const LOCATION_ERRORS: Record<number, string> = {
  1: 'Location is blocked for this site. Allow location access in your browser’s site settings, then try again.',
  2: 'Your location isn’t available right now. Check that location services are on, then try again.',
  3: 'Finding your location took too long. Please try again.',
};

// Above this, the browser probably guessed from Wi-Fi or IP rather than GPS.
const APPROXIMATE_METRES = 500;

// How often to check for an owner's reply while a report is still open.
const POLL_MS = 20_000;

export function ReportView() {
  const initialPlate = useSearchParams().get('plate') ?? '';
  const history = useLoad(reportsApi.list);
  const [submitted, setSubmitted] = useState<Report | null>(null);

  // Reports are open until the owner replies or they close automatically.
  const waiting = !!history.data?.some(r => r.status === 'submitted' || r.status === 'notified');
  useAutoRefresh(history.reload, { polling: waiting, everyMs: POLL_MS });

  return (
    <>
      <PageHeader
        title="Report a car"
        subtitle="The owner is alerted anonymously. They never see who you are."
      />
      {submitted ? (
        <SubmittedCard report={submitted} onDone={() => setSubmitted(null)} />
      ) : (
        <ReportForm
          initialPlate={initialPlate}
          onSubmitted={report => {
            setSubmitted(report);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            history.reload();
          }}
        />
      )}

      <section className="mt-12">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className="text-lg font-semibold">Your reports</h2>
          {waiting && (
            <p className="text-xs text-text-muted">Updates automatically while this page is open</p>
          )}
        </div>
        <ErrorBanner message={history.error} />
        {history.loading && <Spinner className="size-6 text-brand" />}
        {history.data?.length === 0 && (
          <EmptyState
            title="No reports yet"
            body="Reports you file appear here, with updates as the owner responds."
          />
        )}
        <ul className="space-y-3">
          {history.data?.map(report => {
            const status = reportStatus(report);
            return (
              <li key={report.id}>
                <Card className="flex items-center justify-between gap-4 p-4">
                  <div>
                    <p className="font-semibold">{report.plate_number}</p>
                    <p className="text-sm text-text-secondary">
                      {issueLabel(report.issue_type)} · {formatDateTime(report.created_at)}
                    </p>
                  </div>
                  <Badge tone={status.tone}>{status.label}</Badge>
                </Card>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}

function ReportForm({ initialPlate, onSubmitted }: {
  initialPlate: string;
  onSubmitted: (report: Report) => void;
}) {
  const [plate, setPlate] = useState(initialPlate);
  const [location, setLocation] = useState<Location | null>(null);
  const [locating, setLocating] = useState(false);
  const [issueType, setIssueType] = useState<IssueType | null>(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const findLocation = () => {
    if (!('geolocation' in navigator)) {
      setError('This browser can’t share your location. Try a different browser or the RePark app.');
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setLocating(false);
      },
      err => {
        setError(LOCATION_ERRORS[err.code] ?? 'Couldn’t get your location. Please try again.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plate.trim()) return setError('Enter the plate number.');
    if (!location) return setError('Confirm your location before sending the report.');
    if (!issueType) return setError('Choose what the problem is.');

    setSubmitting(true);
    setError(null);
    try {
      const report = await reportsApi.create({
        plate_number: plate.trim(),
        latitude: location.latitude,
        longitude: location.longitude,
        issue_type: issueType,
        message: message.trim() || undefined,
      });
      onSubmitted(report);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Couldn’t send the report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={submit} className="space-y-6">
        <ErrorBanner message={error} />

        <Field label="Plate number">
          <input
            className={`${inputClass} font-semibold uppercase tracking-wider`}
            placeholder="ABC 123"
            value={plate}
            onChange={e => setPlate(e.target.value)}
            autoCapitalize="characters"
            autoComplete="off"
            maxLength={12}
            required
          />
        </Field>

        <div>
          <span className="mb-1.5 block text-sm font-medium">Your location</span>
          {location ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-go/30 bg-go-tint px-4 py-3">
              <span className="text-sm text-go">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <CheckIcon className="size-4" /> Location confirmed
                </span>
                {location.accuracy > APPROXIMATE_METRES && (
                  <span className="block text-text">
                    Only approximate (within about {Math.round(location.accuracy / 100) / 10} km).
                    For better accuracy, report from your phone.
                  </span>
                )}
              </span>
              <Button type="button" variant="ghost" onClick={findLocation} loading={locating}>
                Update
              </Button>
            </div>
          ) : (
            <Button type="button" variant="secondary" onClick={findLocation} loading={locating}>
              Use my current location
            </Button>
          )}
          <span className="mt-1.5 block text-xs text-text-muted">
            Used to check you’re near the car. It isn’t shown to the owner.
          </span>
        </div>

        <fieldset>
          <legend className="mb-1.5 block text-sm font-medium">What’s the problem?</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {ISSUE_TYPES.map(issue => (
              <label
                key={issue.value}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm ${
                  issueType === issue.value
                    ? 'border-brand bg-brand-tint font-medium text-brand'
                    : 'border-line hover:border-line-strong'
                }`}
              >
                <input
                  type="radio"
                  name="issue"
                  value={issue.value}
                  checked={issueType === issue.value}
                  onChange={() => setIssueType(issue.value)}
                  className="accent-brand"
                />
                {issue.label}
              </label>
            ))}
          </div>
        </fieldset>

        <Field label="Note for the owner (optional)" hint="Don’t include your name or contact details.">
          <textarea
            className={`${inputClass} min-h-24`}
            value={message}
            onChange={e => setMessage(e.target.value)}
            maxLength={500}
            placeholder="e.g. Blocking the garage exit at number 12"
          />
        </Field>

        <Button type="submit" loading={submitting} className="w-full sm:w-auto sm:px-8">
          Send alert
        </Button>
      </form>
    </Card>
  );
}

function SubmittedCard({ report, onDone }: { report: Report; onDone: () => void }) {
  return (
    <Card className="p-8 text-center">
      <span
        className={`mx-auto grid size-16 place-items-center rounded-full ${
          report.owner_notified ? 'bg-go-tint text-go' : 'bg-signal-tint text-text'
        }`}
      >
        {report.owner_notified ? <CheckIcon className="size-8" /> : <ClockIcon className="size-8" />}
      </span>
      <h2 className="mt-4 text-xl font-bold">
        {report.owner_notified ? 'Owner alerted' : 'Report saved'}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-text-secondary">
        {report.owner_notified
          ? 'We’ve sent the owner an anonymous alert. You’ll see their response in your reports below.'
          : 'This plate isn’t on RePark yet. If the owner registers it in the next 2 hours, we’ll alert them.'}
      </p>
      <p className="mt-4 font-semibold">
        {report.plate_number} · {issueLabel(report.issue_type)}
      </p>
      <Button variant="secondary" className="mt-6" onClick={onDone}>
        Report another car
      </Button>
    </Card>
  );
}
