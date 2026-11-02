'use client';

import { useState } from 'react';
import { CircleAlert } from 'lucide-react';
import { formatPlateInput } from '@/lib/plate';

type PlateSize = 'L' | 'M' | 'compact';

/**
 * A number plate. Every place a car appears leads with one (handoff components.md).
 * L: 80 high, M: 52 high, compact: 28 high for list rows.
 */
export function Plate({ plate, size = 'compact', className = '' }: {
  plate: string;
  size?: PlateSize;
  className?: string;
}) {
  const text = plate.toUpperCase();
  // Plate text never truncates: past 8 characters and a space, L steps down to M.
  const s = size === 'L' && text.length > 9 ? 'M' : size;

  if (s === 'compact') {
    return (
      <span
        className={`inline-flex h-7 shrink-0 items-center whitespace-nowrap rounded-plate-sm border-[1.5px] border-text bg-surface px-[9px] font-mono text-[15px] font-semibold leading-none tracking-[0.1em] text-text ${className}`}
      >
        {text}
      </span>
    );
  }

  const large = s === 'L';
  return (
    <span
      role="img"
      aria-label={`Plate ${text}`}
      className={`relative flex shrink-0 items-center overflow-hidden border-2 border-text bg-surface text-text shadow-[inset_0_0_0_3px_var(--color-surface),inset_0_0_0_4px_var(--color-line-strong)] ${
        large ? 'h-20 rounded-plate' : 'h-13 rounded-[5px]'
      } ${className}`}
    >
      <span aria-hidden className={`absolute inset-y-0 left-0 bg-brand ${large ? 'w-5' : 'w-3.5'}`} />
      <span
        aria-hidden
        className={`flex-1 whitespace-nowrap text-center font-mono font-semibold tracking-[0.12em] ${
          large ? 'pl-7 pr-2 text-[40px]' : 'pl-5 pr-3 text-2xl'
        }`}
      >
        {text}
      </span>
    </span>
  );
}

/**
 * Plate entry: blank dashed plate when empty, brand border and ring when focused,
 * each new character "stamps" in. Shows uppercase with one space; submit with plateForSubmit().
 */
export function PlateInput({
  id,
  value,
  onChange,
  error,
  disabled,
  autoFocus,
  label = 'Plate number',
  className = '',
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  disabled?: boolean;
  autoFocus?: boolean;
  label?: string;
  className?: string;
}) {
  const [focused, setFocused] = useState(false);
  const errorId = id ? `${id}-error` : undefined;

  const border = error
    ? 'border-stop'
    : focused
      ? 'border-brand ring-4 ring-brand-tint'
      : value
        ? 'border-text'
        : 'border-dashed border-line-strong';

  return (
    <div className={className}>
      <div
        className={`relative h-20 rounded-control border-2 bg-surface transition-[border-color,box-shadow] duration-200 ease-ui ${border} ${
          disabled ? 'opacity-45' : ''
        }`}
      >
        {/* The input's own text is transparent; the letters drawn on top can animate. */}
        <input
          id={id}
          aria-label={label}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className="absolute inset-0 h-full w-full rounded-control bg-transparent px-4 text-center font-mono text-[34px] font-semibold tracking-[0.12em] text-transparent caret-brand outline-none placeholder:text-text-muted sm:text-4xl"
          placeholder="ABC 123"
          value={value}
          onChange={e => onChange(formatPlateInput(e.target.value))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          autoFocus={autoFocus}
          autoCapitalize="characters"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          maxLength={11}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center px-4 font-mono text-[34px] font-semibold tracking-[0.12em] text-text sm:text-4xl"
        >
          {/* Keys include the character, so a new or changed character mounts and stamps. */}
          {[...value].map((ch, i) => (
            <span key={`${i}-${ch}`} className="inline-block animate-stamp whitespace-pre">
              {ch}
            </span>
          ))}
        </div>
      </div>
      {error && (
        <p id={errorId} className="mt-2 flex gap-1.5 text-[13px] font-medium text-stop">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  );
}
