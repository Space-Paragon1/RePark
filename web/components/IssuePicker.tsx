'use client';

import { CircleCheck } from 'lucide-react';
import type { IssueType } from '@/lib/api';
import { ISSUE_TYPES } from '@/lib/labels';

/**
 * The five issues. Desktop: a 2-column grid; selected rows get brand-tint and a 1.5 px brand
 * border with a filled check. The whole row is the target; a real radio keeps it accessible.
 */
export function IssuePicker({ value, onChange, name = 'issue' }: {
  value: IssueType | null;
  onChange: (value: IssueType) => void;
  name?: string;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {ISSUE_TYPES.map(({ value: issue, label, Icon }) => {
        const selected = issue === value;
        return (
          <label
            key={issue}
            className={`flex min-h-13 cursor-pointer items-center gap-3 rounded-control border-[1.5px] px-3.5 py-3 transition-colors duration-200 ease-ui has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-brand ${
              selected ? 'border-brand bg-brand-tint' : 'border-line bg-surface hover:border-line-strong'
            }`}
          >
            <input
              type="radio"
              name={name}
              value={issue}
              checked={selected}
              onChange={() => onChange(issue)}
              className="sr-only"
            />
            <Icon className={`size-5 shrink-0 ${selected ? 'text-brand' : 'text-text-secondary'}`} aria-hidden />
            <span className={`flex-1 font-semibold ${selected ? 'text-brand' : 'text-text'}`}>{label}</span>
            {selected ? (
              <CircleCheck className="size-[22px] shrink-0 fill-brand text-on-brand" aria-hidden />
            ) : (
              <span className="size-5 shrink-0 rounded-full border-[1.5px] border-line-strong" aria-hidden />
            )}
          </label>
        );
      })}
    </div>
  );
}
