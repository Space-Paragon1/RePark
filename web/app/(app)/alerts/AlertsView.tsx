'use client';

import { useEffect, useState } from 'react';
import { Bell, Car, Flag, ShieldCheck, TriangleAlert } from 'lucide-react';
import { alertsApi, type AlertDetail, type OwnerResponseType } from '@/lib/api';
import { REPLY_SENT, alertMeta, alertStatus, issueFor, issueLabel } from '@/lib/labels';
import { supabase } from '@/lib/supabase';
import { useLoad } from '@/lib/useLoad';
import { Plate } from '@/components/Plate';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { SkeletonRows } from '@/components/Skeleton';
import { useToast } from '@/components/Toast';
import { Button, ButtonLink, Chip, EmptyState, ErrorBanner, ListError, PageHeader } from '@/components/ui';

export function AlertsView() {
  const alerts = useLoad(alertsApi.list);
  const { reload } = alerts;
  const toast = useToast();
  const [responding, setResponding] = useState<{ id: string; response: OwnerResponseType } | null>(null);
  const [error, setError] = useState<string | null>(null);
  // The alert waiting on the "Mark as incorrect?" confirmation.
  const [confirmingIncorrect, setConfirmingIncorrect] = useState<AlertDetail | null>(null);

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

  const respond = async (alert: AlertDetail, response: OwnerResponseType) => {
    setResponding({ id: alert.id, response });
    setError(null);
    try {
      const updated = await alertsApi.respond(alert.id, response);
      alerts.setData(prev => prev?.map(a => (a.id === alert.id ? updated : a)) ?? null);
      toast(REPLY_SENT);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Couldn’t send your reply.');
    } finally {
      setResponding(null);
      setConfirmingIncorrect(null);
    }
  };

  const needsReply = alerts.data?.filter(a => !a.owner_response) ?? [];
  const replied = alerts.data?.filter(a => a.owner_response) ?? [];

  return (
    <>
      <PageHeader title="Alerts" subtitle="Reports about your cars. Your reply is sent anonymously." />
      <ErrorBanner message={error} />
      {alerts.error && !alerts.data && <ListError list="alerts" onRetry={reload} />}
      {alerts.loading && <SkeletonRows />}

      {alerts.data?.length === 0 && (
        <EmptyState
          icon={Bell}
          title="No alerts"
          body="When someone reports one of your cars, it shows up here and on your lock screen."
          action={<ButtonLink href="/vehicles" variant="secondary">Add a vehicle</ButtonLink>}
        />
      )}

      {needsReply.length > 0 && (
        <section aria-labelledby="needs-reply">
          <h2 id="needs-reply" className="mb-3 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
            Needs your reply · {needsReply.length}
          </h2>
          <ul className="space-y-4">
            {needsReply.map(alert => (
              <li key={alert.id}>
                <NeedsReplyCard
                  alert={alert}
                  responding={responding?.id === alert.id ? responding.response : null}
                  onRespond={response => respond(alert, response)}
                  onIncorrect={() => setConfirmingIncorrect(alert)}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {replied.length > 0 && (
        <section aria-labelledby="replied" className="mt-10">
          <h2 id="replied" className="mb-3 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
            Replied · {replied.length}
          </h2>
          <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
            {replied.map(alert => (
              <li key={alert.id} className="flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-4">
                <Plate plate={alert.plate_number} />
                <span className="min-w-40 flex-1 text-sm font-semibold">{issueLabel(alert.issue_type)}</span>
                <span className="font-mono text-xs font-medium text-text-muted">{alertMeta(alert)}</span>
                <Chip status={alertStatus(alert)} dense />
              </li>
            ))}
          </ul>
        </section>
      )}

      <ConfirmDialog
        open={!!confirmingIncorrect}
        icon={Flag}
        title="Mark this report as incorrect?"
        body="Only choose this if your car wasn’t there or wasn’t in the way. Incorrect reports count against the person who sent them."
        confirmLabel="Mark as incorrect"
        confirmingLabel="Marking"
        cancelLabel="Keep the report"
        busy={responding?.response === 'incorrect_report'}
        onConfirm={() => confirmingIncorrect && respond(confirmingIncorrect, 'incorrect_report')}
        onCancel={() => setConfirmingIncorrect(null)}
      />
    </>
  );
}

/** Needs reply (screens.md): plate L | details | a stack of the three replies. Stacks on phones. */
function NeedsReplyCard({ alert, responding, onRespond, onIncorrect }: {
  alert: AlertDetail;
  responding: OwnerResponseType | null;
  onRespond: (response: OwnerResponseType) => void;
  onIncorrect: () => void;
}) {
  const IssueIcon = issueFor(alert.issue_type)?.Icon ?? TriangleAlert;
  return (
    <article className="overflow-hidden rounded-card border border-line bg-surface">
      <div className="kerb-stripe h-1.5" aria-hidden />
      <div className="grid gap-6 p-5 md:grid-cols-[300px_1fr_220px] md:items-center md:p-6">
        <Plate plate={alert.plate_number} size="L" className="w-full" />
        <div className="min-w-0">
          <Chip status={alertStatus(alert)} />
          <h3 className="mt-3 text-xl font-extrabold tracking-[-0.01em]">Someone’s blocked in by your car.</h3>
          <p className="mt-2 flex items-center gap-2 font-semibold">
            <Car className="size-5 shrink-0 text-text-secondary" aria-hidden />
            {alert.color} {alert.make} {alert.model}
          </p>
          <p className="mt-1 flex items-center gap-2 font-semibold">
            <IssueIcon className="size-5 shrink-0 text-text-secondary" aria-hidden />
            {issueLabel(alert.issue_type)}
          </p>
          <p className="mt-2 font-mono text-xs font-medium text-text-muted">{alertMeta(alert)}</p>
          <p className="mt-3 flex gap-2 text-sm text-text-secondary">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
            You won’t see who reported this, and they won’t see who you are.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Button
            loading={responding === 'moving_now'}
            loadingLabel="Sending"
            disabled={!!responding}
            onClick={() => onRespond('moving_now')}
          >
            Moving now
          </Button>
          <Button
            variant="secondary"
            loading={responding === 'already_moved'}
            loadingLabel="Sending"
            disabled={!!responding}
            onClick={() => onRespond('already_moved')}
          >
            Already moved
          </Button>
          <Button variant="quietStop" disabled={!!responding} onClick={onIncorrect}>
            Incorrect report
          </Button>
        </div>
      </div>
    </article>
  );
}
