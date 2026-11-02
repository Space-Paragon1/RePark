'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Car, Send, ShieldCheck } from 'lucide-react';
import { alertsApi, reportsApi, vehiclesApi, type AlertDetail, type OwnerResponseType, type Report } from '@/lib/api';
import { REPLY_SENT, alertMeta, formatTime, isReportOpen, issueLabel } from '@/lib/labels';
import { timeLeftToJoin } from '@/lib/report';
import { useLoad } from '@/lib/useLoad';
import { Plate } from '@/components/Plate';
import { SkeletonRows } from '@/components/Skeleton';
import { useToast } from '@/components/Toast';
import { Button, ButtonLink, Card, ErrorBanner, ListError, PageHeader } from '@/components/ui';

const MAX_VEHICLES = 10;

async function loadDashboard() {
  const [vehicles, alerts, reports] = await Promise.all([
    vehiclesApi.list(),
    alertsApi.list(),
    reportsApi.list(),
  ]);
  return { vehicles, alerts, reports };
}

const kicker = 'mb-3 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-text-muted';

/** Dashboard (screens.md): Needs your reply → Your reports in progress → Your vehicles. */
export function DashboardView() {
  const { data, error, loading, setData, reload } = useLoad(loadDashboard);
  const toast = useToast();
  const [responding, setResponding] = useState<string | null>(null);
  const [replyError, setReplyError] = useState<string | null>(null);

  const needsReply = data?.alerts.filter(a => !a.owner_response) ?? [];
  const inProgress = data?.reports.filter(isReportOpen) ?? [];

  const respond = async (alert: AlertDetail, response: OwnerResponseType) => {
    setResponding(alert.id);
    setReplyError(null);
    try {
      const updated = await alertsApi.respond(alert.id, response);
      setData(prev => prev && { ...prev, alerts: prev.alerts.map(a => (a.id === alert.id ? updated : a)) });
      toast(REPLY_SENT);
    } catch (e) {
      setReplyError(e instanceof Error ? e.message : 'Couldn’t send your reply.');
    } finally {
      setResponding(null);
    }
  };

  return (
    <>
      <PageHeader title="Dashboard" />
      <ErrorBanner message={replyError} />
      {error && !data && <ListError list="dashboard" onRetry={reload} />}

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-10">
          {loading && <SkeletonRows count={2} />}

          {needsReply.length > 0 && (
            <section aria-labelledby="needs-reply">
              <h2 id="needs-reply" className={kicker}>Needs your reply · {needsReply.length}</h2>
              <ul className="space-y-3">
                {needsReply.map(alert => (
                  <li key={alert.id} className="overflow-hidden rounded-card border border-line bg-surface">
                    <div className="kerb-stripe h-1.5" aria-hidden />
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-4 p-5">
                      <Plate plate={alert.plate_number} size="M" />
                      <Link href="/alerts" className="min-w-48 flex-1 hover:underline">
                        <span className="block text-[17px] font-bold">{issueLabel(alert.issue_type)}</span>
                        <span className="mt-1 block font-mono text-xs text-text-muted">
                          {alert.color} {alert.make} {alert.model} · {alertMeta(alert)}
                        </span>
                      </Link>
                      <div className="flex gap-2">
                        <Button
                          disabled={responding !== null}
                          loading={responding === alert.id}
                          loadingLabel="Sending"
                          onClick={() => respond(alert, 'moving_now')}
                        >
                          Moving now
                        </Button>
                        <Button variant="secondary" disabled={responding !== null} onClick={() => respond(alert, 'already_moved')}>
                          Already moved
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {inProgress.length > 0 && (
            <section aria-labelledby="in-progress">
              <h2 id="in-progress" className={kicker}>Your reports in progress · {inProgress.length}</h2>
              <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
                {inProgress.map(report => <li key={report.id}><ReportProgress report={report} /></li>)}
              </ul>
            </section>
          )}

          {data && needsReply.length === 0 && inProgress.length === 0 && (
            <Card className="px-6 py-8 text-center">
              <span className="mx-auto grid size-12 place-items-center rounded-full bg-go-tint text-go">
                <ShieldCheck className="size-6" aria-hidden />
              </span>
              <p className="mt-4 text-lg font-bold">Nothing needs you right now.</p>
              <p className="mt-1 text-sm text-text-secondary">No alerts about your cars and no reports waiting.</p>
              <ButtonLink href="/report" icon={Send} className="mt-6">Report a car</ButtonLink>
            </Card>
          )}
        </div>

        <aside aria-labelledby="your-vehicles">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 id="your-vehicles" className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
              Your vehicles{data ? ` · ${data.vehicles.length} of ${MAX_VEHICLES}` : ''}
            </h2>
            <Link href="/vehicles" className="text-sm font-semibold text-brand hover:underline">Manage</Link>
          </div>
          {loading && <SkeletonRows count={2} card={false} />}
          {data?.vehicles.length === 0 && (
            <Card className="text-center">
              <Car className="mx-auto size-6 text-text-secondary" aria-hidden />
              <p className="mt-2 text-sm text-text-secondary">Add your plate so people can reach you without knowing who you are.</p>
              <ButtonLink href="/vehicles" variant="secondary" className="mt-4">Add a vehicle</ButtonLink>
            </Card>
          )}
          <ul className="space-y-3">
            {data?.vehicles.map(vehicle => (
              <li key={vehicle.id} className="flex items-center gap-4 rounded-card border border-line bg-surface p-4">
                <Plate plate={vehicle.plate_number} size="M" />
                <span className="font-medium">{vehicle.color} {vehicle.make} {vehicle.model}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </>
  );
}

/** A report still waiting: plate | Sent → Alerted → Waiting | View. */
function ReportProgress({ report }: { report: Report }) {
  const sent = formatTime(report.created_at);
  const closes = formatTime(new Date(Date.parse(report.created_at) + 24 * 3_600_000).toISOString());
  const steps = report.owner_notified
    ? [
        { label: 'Sent', time: sent, done: true },
        { label: 'Owner alerted', time: sent, done: true },
        { label: 'Waiting', time: `closes ${closes} tmrw`, done: false },
      ]
    : [
        { label: 'Sent', time: sent, done: true },
        { label: 'Owner not on RePark yet', time: timeLeftToJoin(report), done: false },
      ];
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 p-4">
      <Plate plate={report.plate_number} />
      <ol className="grid min-w-64 flex-1 gap-3" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
        {steps.map(step => (
          <li key={step.label}>
            <span
              aria-hidden
              className={`block h-0.5 ${
                step.done ? 'bg-brand' : 'bg-[repeating-linear-gradient(to_right,var(--color-line-strong)_0_6px,transparent_6px_10px)]'
              }`}
            />
            <span className="mt-2 block text-sm font-semibold">{step.label}</span>
            <span className="block font-mono text-xs text-text-muted">{step.time}</span>
          </li>
        ))}
      </ol>
      <Link href={`/report?view=${report.id}`} className="text-sm font-semibold text-brand hover:underline">View</Link>
    </div>
  );
}
