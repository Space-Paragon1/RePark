// Display text shared across screens. Wording follows the handoff copy deck
// (design_handoff_repark_redesign/copy.md); keep in step with web/lib/labels.ts.
import type { AlertDetail, IssueType, OwnerResponseType, PlateClaim, Report } from './api';
import {
  Ban, Bell, Car, Check, CheckCheck, Clock, Construction, Flag, Hourglass, House, Siren, Trash2,
  TriangleAlert, UserX, X, type LucideIcon,
} from '@/components/icons';

export const ISSUE_TYPES: {
  value: IssueType;
  label: string;
  /** Lower-case form for sentences, e.g. "Your car is blocking a driveway or access." */
  phrase: string;
  Icon: LucideIcon;
}[] = [
  { value: 'blocking_driveway',   label: 'Blocking driveway or access', phrase: 'blocking a driveway or access', Icon: House },
  { value: 'construction_access', label: 'Construction access blocked', phrase: 'blocking construction access', Icon: Construction },
  { value: 'garbage_pickup',      label: 'Garbage pickup obstruction',  phrase: 'blocking garbage pickup',       Icon: Trash2 },
  { value: 'restricted_zone',     label: 'Restricted parking zone',     phrase: 'parked in a restricted zone',   Icon: Ban },
  { value: 'emergency_access',    label: 'Emergency access blocked',    phrase: 'blocking emergency access',     Icon: Siren },
];

export function issueFor(value: string) {
  return ISSUE_TYPES.find(i => i.value === value);
}

export function issueLabel(value: string): string {
  return issueFor(value)?.label ?? value;
}

export const RESPONSE_LABELS: Record<OwnerResponseType, string> = {
  moving_now:       'Moving now',
  already_moved:    'Already moved',
  incorrect_report: 'Incorrect report',
  abuse_reported:   'Reported as abuse',
};

// ─── Statuses (tokens.md status table: icon + word + colour) ─────────────────

export type ChipTone = 'signal' | 'brand' | 'go' | 'stop' | 'neutral';
export type Status = { label: string; tone: ChipTone; Icon: LucideIcon };

/** A report, as the reporter sees it. */
export function reportStatus(report: Report): Status {
  if (!report.owner_notified) {
    // No alert went out: the plate isn't registered. Closed after 2 hours.
    return report.status === 'closed'
      ? { label: 'Owner not on RePark', tone: 'neutral', Icon: UserX }
      : { label: 'Owner not on RePark yet', tone: 'brand', Icon: Hourglass };
  }
  switch (report.status) {
    case 'responded': return { label: 'Owner responded', tone: 'go', Icon: Check };
    case 'rejected':  return { label: 'Incorrect report', tone: 'stop', Icon: Flag };
    case 'closed':    return { label: 'No response', tone: 'neutral', Icon: Clock };
    default:          return { label: 'Owner notified', tone: 'brand', Icon: Bell };
  }
}

/** True while the report is waiting on the owner. */
export function isReportOpen(report: Report): boolean {
  return report.status === 'submitted' || report.status === 'notified';
}

/** An alert, as the owner sees it. */
export function alertStatus(alert: AlertDetail): Status {
  switch (alert.owner_response) {
    case null:            return { label: 'Needs your reply', tone: 'signal', Icon: TriangleAlert };
    case 'moving_now':    return { label: 'Moving now', tone: 'go', Icon: Car };
    case 'already_moved': return { label: 'Already moved', tone: 'go', Icon: CheckCheck };
    default:              return { label: RESPONSE_LABELS[alert.owner_response], tone: 'stop', Icon: Flag };
  }
}

export function claimStatus(claim: PlateClaim): Status {
  switch (claim.status) {
    case 'approved': return { label: 'Approved', tone: 'go', Icon: Check };
    case 'rejected': return { label: 'Not approved', tone: 'stop', Icon: X };
    default:         return { label: 'Under review', tone: 'brand', Icon: Clock };
  }
}

// ─── Dates and times ──────────────────────────────────────────────────────────

/** "3 Mar 2026" */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

/** "21:42" in the device's 12/24-hour style */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

/** "Today 21:42", "Yesterday 21:42", or "31 Oct 21:42" */
export function formatWhen(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  const day = sameDay(d, today) ? 'Today'
    : sameDay(d, yesterday) ? 'Yesterday'
    : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  return `${day} ${formatTime(iso)}`;
}

// ─── Alerts ───────────────────────────────────────────────────────────────────

/** Mono meta line: "Reported 21:42 · Delivered 21:42 · You replied 09:13". */
export function alertMeta(alert: AlertDetail): string {
  const parts = [`Reported ${formatTime(alert.reported_at)}`];
  if (alert.delivery_status === 'sent') parts.push(`Delivered ${formatTime(alert.created_at)}`);
  if (alert.delivery_status === 'failed') parts.push('Not delivered');
  if (alert.responded_at) parts.push(`You replied ${formatTime(alert.responded_at)}`);
  return parts.join(' · ');
}

/** What the owner sees after replying. */
export function replyThanks(response: OwnerResponseType): string {
  switch (response) {
    case 'moving_now':    return "Thanks. We've told them you're on your way.";
    case 'already_moved': return "Thanks. We've told them the car has gone.";
    default:              return "We've marked this report as incorrect.";
  }
}

export const REPLY_SENT = "Reply sent. We've let them know.";
