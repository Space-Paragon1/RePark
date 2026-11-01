// Display text shared across pages. Keep in step with the mobile app's labels.
import type { IssueType, OwnerResponseType, Report } from './api';

export const ISSUE_TYPES: { value: IssueType; label: string }[] = [
  { value: 'blocking_driveway',   label: 'Blocking driveway / access' },
  { value: 'construction_access', label: 'Construction access blocked' },
  { value: 'garbage_pickup',      label: 'Garbage pickup obstruction' },
  { value: 'restricted_zone',     label: 'Restricted parking zone' },
  { value: 'emergency_access',    label: 'Emergency access blocked' },
];

export function issueLabel(value: string): string {
  return ISSUE_TYPES.find(i => i.value === value)?.label ?? value;
}

export const RESPONSE_LABELS: Record<OwnerResponseType, string> = {
  moving_now:       'Moving now',
  already_moved:    'Already moved',
  incorrect_report: 'Incorrect report',
  abuse_reported:   'Reported as abuse',
};

export type Tone = 'neutral' | 'blue' | 'green' | 'red' | 'amber';

/** Status badge for a report, as the reporter sees it. */
export function reportStatus(report: Report): { label: string; tone: Tone } {
  if (!report.owner_notified) {
    // No alert went out: the plate isn't registered. Closed after 2 hours.
    return report.status === 'closed'
      ? { label: 'Owner not on RePark', tone: 'neutral' }
      : { label: 'Owner not on RePark yet', tone: 'amber' };
  }
  switch (report.status) {
    case 'responded': return { label: 'Owner responded', tone: 'green' };
    case 'rejected':  return { label: 'Incorrect report', tone: 'red' };
    case 'closed':    return { label: 'No response', tone: 'neutral' };
    default:          return { label: 'Owner notified', tone: 'blue' };
  }
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}
