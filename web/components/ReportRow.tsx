import { ChevronRight } from 'lucide-react';
import type { Report } from '@/lib/api';
import { formatWhen, issueLabel, reportStatus } from '@/lib/labels';
import { Plate } from './Plate';
import { Chip } from './ui';

/** Report row (components.md): plate, issue, mono time, chevron; status chip beneath. */
export function ReportRow({ report, onOpen }: { report: Report; onOpen?: () => void }) {
  const status = reportStatus(report);
  const content = (
    <>
      <span className="flex items-center gap-3">
        <Plate plate={report.plate_number} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{issueLabel(report.issue_type)}</span>
          <span className="block font-mono text-xs font-medium text-text-muted">{formatWhen(report.created_at)}</span>
        </span>
        {onOpen && <ChevronRight className="size-[18px] shrink-0 text-text-muted" aria-hidden />}
      </span>
      <Chip status={status} dense className="mt-2.5" />
    </>
  );
  if (!onOpen) return <div className="p-3.5">{content}</div>;
  return (
    <button type="button" onClick={onOpen} className="block w-full p-3.5 text-left transition-colors hover:bg-surface-sunken">
      {content}
    </button>
  );
}
