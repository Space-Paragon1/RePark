'use client';

import Link from 'next/link';
import { alertsApi, reportsApi, vehiclesApi } from '@/lib/api';
import { formatDateTime, issueLabel, reportStatus } from '@/lib/labels';
import { useLoad } from '@/lib/useLoad';
import { Badge, ButtonLink, Card, ErrorBanner, PageHeader, Spinner } from '@/components/ui';
import { ArrowRightIcon } from '@/components/icons';

async function loadDashboard() {
  const [vehicles, alerts, reports] = await Promise.all([
    vehiclesApi.list(),
    alertsApi.list(),
    reportsApi.list(),
  ]);
  return { vehicles, alerts, reports };
}

export function DashboardView() {
  const { data, error, loading } = useLoad(loadDashboard);
  const pendingAlerts = data?.alerts.filter(a => !a.owner_response) ?? [];

  const stats = [
    { label: 'Vehicles registered', value: data?.vehicles.length, href: '/vehicles' },
    { label: 'Alerts waiting for you', value: pendingAlerts.length, href: '/alerts' },
    { label: 'Reports filed', value: data?.reports.length, href: '/report' },
  ];

  return (
    <>
      <PageHeader
        title="Welcome to RePark"
        subtitle="Report a car that’s blocking you, or manage alerts about your own."
        action={<ButtonLink href="/report">Report a car</ButtonLink>}
      />
      <ErrorBanner message={error} />

      {pendingAlerts.length > 0 && (
        <Link
          href="/alerts"
          className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-signal/50 bg-signal-tint p-5 hover:border-signal"
        >
          <span>
            <span className="block font-semibold text-text">
              {pendingAlerts.length === 1 ? 'Your car was reported' : `${pendingAlerts.length} alerts about your cars`}
            </span>
            <span className="text-sm text-text-secondary">Let the reporter know if you’re moving it.</span>
          </span>
          <ArrowRightIcon className="size-5 shrink-0 text-text" />
        </Link>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map(stat => (
          <Link key={stat.label} href={stat.href}>
            <Card className="h-full hover:border-brand">
              <p className="text-3xl font-bold text-text">
                {loading ? <Spinner className="size-6 text-brand" /> : stat.value ?? '—'}
              </p>
              <p className="mt-1 text-sm text-text-secondary">{stat.label}</p>
            </Card>
          </Link>
        ))}
      </div>

      <section className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent reports</h2>
          {!!data?.reports.length && (
            <Link href="/report" className="text-sm font-medium text-brand hover:underline">See all</Link>
          )}
        </div>
        {data && data.reports.length === 0 && (
          <p className="text-text-secondary">You haven’t reported any cars yet.</p>
        )}
        <ul className="space-y-3">
          {data?.reports.slice(0, 3).map(report => {
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
