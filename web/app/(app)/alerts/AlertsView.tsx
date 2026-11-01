'use client';

import { useEffect, useState } from 'react';
import { alertsApi, type AlertDetail, type OwnerResponseType } from '@/lib/api';
import { RESPONSE_LABELS, formatDateTime, issueLabel } from '@/lib/labels';
import { supabase } from '@/lib/supabase';
import { useLoad } from '@/lib/useLoad';
import { Badge, Button, ButtonLink, Card, EmptyState, ErrorBanner, PageHeader, Spinner } from '@/components/ui';

const RESPONSES: { value: OwnerResponseType; label: string; variant: 'primary' | 'secondary' | 'danger' }[] = [
  { value: 'moving_now',       label: 'Moving now',       variant: 'primary' },
  { value: 'already_moved',    label: 'Already moved',    variant: 'secondary' },
  { value: 'incorrect_report', label: 'Incorrect report', variant: 'danger' },
];

export function AlertsView() {
  const alerts = useLoad(alertsApi.list);
  const { reload } = alerts;
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Live updates: database access rules limit these events to the user's own alerts.
  useEffect(() => {
    const client = supabase();
    const channel = client
      .channel('web-alerts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alerts' }, () => reload())
      .subscribe();
    // Also catch anything missed while the tab was in the background.
    const onFocus = () => reload();
    window.addEventListener('focus', onFocus);
    return () => {
      client.removeChannel(channel);
      window.removeEventListener('focus', onFocus);
    };
  }, [reload]);

  const respond = async (alert: AlertDetail, response: OwnerResponseType, label: string) => {
    const extra = response === 'incorrect_report'
      ? '\n\nOnly use this if your car wasn’t there or wasn’t causing a problem. It counts against the reporter.'
      : '';
    if (!window.confirm(`Reply "${label}" for ${alert.plate_number}?${extra}`)) return;

    setRespondingId(alert.id);
    setError(null);
    try {
      const updated = await alertsApi.respond(alert.id, response);
      alerts.setData(prev => prev?.map(a => (a.id === alert.id ? updated : a)) ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Couldn’t send your response.');
    } finally {
      setRespondingId(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Alerts"
        subtitle="When someone reports one of your cars, it shows up here. Your reply is sent anonymously."
      />
      <ErrorBanner message={error ?? alerts.error} />
      {alerts.loading && <Spinner className="size-6 text-brand" />}
      {alerts.data?.length === 0 && (
        <EmptyState
          title="No alerts"
          body="Nobody has reported your vehicles. Make sure your plates are registered so you can be reached."
          action={<ButtonLink href="/vehicles" variant="secondary">My vehicles</ButtonLink>}
        />
      )}

      <ul className="space-y-4">
        {alerts.data?.map(alert => (
          <li key={alert.id}>
            <Card className={alert.owner_response ? '' : 'border-amber-200'}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-bold">{alert.plate_number}</p>
                  <p className="text-sm text-ink-secondary">
                    {alert.color} {alert.make} {alert.model}
                  </p>
                </div>
                {alert.owner_response
                  ? <Badge tone="green">{RESPONSE_LABELS[alert.owner_response]}</Badge>
                  : <Badge tone="amber">Needs your reply</Badge>}
              </div>
              <p className="mt-3 font-medium">{issueLabel(alert.issue_type)}</p>
              <p className="text-sm text-ink-muted">Reported {formatDateTime(alert.reported_at)}</p>

              {!alert.owner_response && (
                <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
                  {RESPONSES.map(r => (
                    <Button
                      key={r.value}
                      variant={r.variant}
                      disabled={respondingId !== null}
                      onClick={() => respond(alert, r.value, r.label)}
                    >
                      {r.label}
                    </Button>
                  ))}
                  {respondingId === alert.id && <Spinner className="size-5 self-center text-brand" />}
                </div>
              )}
            </Card>
          </li>
        ))}
      </ul>
    </>
  );
}
