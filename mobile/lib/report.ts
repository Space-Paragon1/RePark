// Report flow rules and wording (copy.md). Keep in step with web/lib/report.ts.
import { ApiError, type Report } from './api';
import { formatTime, isReportOpen } from './labels';
import type { TimelineStep } from '@/components/Timeline';
import { Bell, Check, Clock, Flag, Hourglass, UserX } from '@/components/icons';

// Limits enforced by the backend (backend/app/routers/reports.py).
export const REPORTS_PER_HOUR = 3;
export const COOLDOWN_MINUTES = 15;
export const NOTE_MAX = 500;
const HOUR = 3_600_000;
const OWNER_JOIN_WAIT = 2 * HOUR; // unregistered plates
const REPLY_WAIT = 24 * HOUR;

/** Reports sent in the last hour. */
export function reportsThisHour(history: Report[], now = Date.now()): Report[] {
  return history.filter(r => now - Date.parse(r.created_at) < HOUR);
}

/** When another report can be sent, or null if under the hourly limit. */
export function nextReportAt(history: Report[]): Date | null {
  const recent = reportsThisHour(history).map(r => Date.parse(r.created_at)).sort((a, b) => a - b);
  return recent.length >= REPORTS_PER_HOUR ? new Date(recent[0] + HOUR) : null;
}

/** Notes can't carry contact details. The server stays the authority. */
export function noteError(note: string): string | null {
  if (/[^\s@]+@[^\s@]+\.[^\s@]+/.test(note)) {
    return "Remove the email address. Notes can't include contact details.";
  }
  const runs = note.match(/\+?\d[\d\s().-]{5,}\d/g) ?? [];
  if (runs.some(run => run.replace(/\D/g, '').length >= 7)) {
    return "Remove the phone number. Notes can't include contact details.";
  }
  return null;
}

const SOMETHING_WRONG = 'Something went wrong on our side. Your details are still here. Try again.';

/** Plain-language message for a failed send (copy.md form errors). */
export function reportErrorMessage(e: unknown, history: Report[], plate: string): string {
  if (!(e instanceof ApiError)) return SOMETHING_WRONG;
  // Older backends send no code; fall back to the status and wording.
  const code = e.code
    ?? (e.status === 403 ? 'reporting_paused'
      : e.status === 429 ? (/recent/i.test(e.message) ? 'plate_cooldown' : 'rate_limited')
      : null);
  switch (code) {
    case 'reporting_paused':
      return 'Reporting is paused for your account after several incorrect reports. You can report again within 24 hours.';
    case 'rate_limited': {
      const at = nextReportAt(history);
      return `You've sent 3 reports in the last hour. You can send another ${at ? `at ${formatTime(at.toISOString())}` : 'soon'}.`;
    }
    case 'plate_cooldown': {
      const last = history.find(r => r.plate_number === plate);
      const at = last ? new Date(Date.parse(last.created_at) + COOLDOWN_MINUTES * 60_000) : null;
      return `This plate was reported in the last 15 minutes. You can report it again ${at ? `at ${formatTime(at.toISOString())}` : 'soon'}.`;
    }
  }
  if (e.status === 422) return 'Use letters and numbers only.';
  if (e.status >= 500) return SOMETHING_WRONG;
  return e.message;
}

/** "21:42:08" */
export function formatTimeSeconds(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

/** "1 h 58 m left" until an unregistered plate's report closes. */
export function timeLeftToJoin(report: Report, now = Date.now()): string {
  const left = Math.max(0, Date.parse(report.created_at) + OWNER_JOIN_WAIT - now);
  const h = Math.floor(left / HOUR);
  const m = Math.floor((left % HOUR) / 60_000);
  return `${h} h ${m} m left`;
}

/** Headline and sentence for a report's current state. */
export function reportOutcome(report: Report): { title: string; body: string } {
  const joinBy = formatTime(new Date(Date.parse(report.created_at) + OWNER_JOIN_WAIT).toISOString());
  if (!report.owner_notified) {
    return report.status === 'closed'
      ? { title: "The owner isn't on RePark.", body: "The plate wasn't registered within 2 hours, so the report closed." }
      : { title: "This plate isn't registered yet.", body: `If the owner signs up by ${joinBy}, we'll alert them straight away. Otherwise the report closes.` };
  }
  switch (report.status) {
    case 'responded': return { title: 'The owner has replied.', body: "They still don't know who you are." };
    case 'rejected':  return { title: 'The owner marked your report as incorrect.', body: 'If the car is still there, check the plate and report it again.' };
    case 'closed':    return { title: 'No reply from the owner.', body: 'Your report closed after 24 hours.' };
    default:          return { title: "We've let the owner know.", body: "They won't see who you are. We'll tell you as soon as they reply." };
  }
}

/** Timeline for a report, as the reporter sees it. */
export function reportTimeline(report: Report): TimelineStep[] {
  const sent: TimelineStep = { title: 'Report sent', time: formatTimeSeconds(report.created_at), state: 'done' };
  if (!report.owner_notified) {
    return [
      sent,
      report.status === 'closed'
        ? { title: 'Owner not on RePark', detail: "The plate wasn't registered in time.", state: 'neutral', icon: UserX }
        : { title: 'Owner not on RePark yet', time: timeLeftToJoin(report), detail: reportOutcome(report).body, state: 'waiting', icon: Hourglass },
    ];
  }
  const alerted: TimelineStep = { title: 'Owner alerted', time: formatTimeSeconds(report.created_at), state: 'done', icon: Bell };
  const closesAt = formatTime(new Date(Date.parse(report.created_at) + REPLY_WAIT).toISOString());
  switch (report.status) {
    case 'responded': return [sent, alerted, { title: 'Owner replied', state: 'go', icon: Check }];
    case 'rejected':  return [sent, alerted, { title: 'Marked as incorrect', state: 'stop', icon: Flag }];
    case 'closed':    return [sent, alerted, { title: 'No response', detail: 'Closed after 24 hours.', state: 'neutral', icon: Clock }];
    default:
      return [sent, alerted, {
        title: 'Waiting for a reply',
        detail: isReportOpen(report) ? `Closes at ${closesAt} tomorrow if there's no reply.` : undefined,
        state: 'pending',
      }];
  }
}
