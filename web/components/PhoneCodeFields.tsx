'use client';

import { useState } from 'react';
import { ChevronDown, CircleAlert } from 'lucide-react';
import { COUNTRIES, formatNational, type Country } from '@/lib/phone';

/**
 * Phone field (components.md): country button ("US +1", mono) on the left, then the number
 * in mono, formatted as typed. On the web the country button is a native select.
 */
export function PhoneField({ id, country, onCountryChange, value, onChange, autoFocus }: {
  id: string;
  country: Country;
  onCountryChange: (country: Country) => void;
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
}) {
  return (
    <div className="flex h-13 overflow-hidden rounded-control border-[1.5px] border-line-strong bg-surface transition-[border-color,box-shadow] duration-200 ease-ui focus-within:border-brand focus-within:ring-4 focus-within:ring-brand-tint">
      <label className="relative flex shrink-0 items-center gap-1 border-r border-line pl-3.5 pr-2.5 font-mono text-base font-semibold">
        <span aria-hidden>{country.code} +{country.dial}</span>
        <ChevronDown className="size-4 text-text-secondary" aria-hidden />
        <select
          aria-label="Country"
          className="absolute inset-0 cursor-pointer opacity-0"
          value={country.code}
          onChange={e => onCountryChange(COUNTRIES.find(c => c.code === e.target.value) ?? country)}
        >
          {COUNTRIES.map(c => (
            <option key={c.code} value={c.code}>{c.name} (+{c.dial})</option>
          ))}
        </select>
      </label>
      <input
        id={id}
        className="min-w-0 flex-1 bg-transparent px-3.5 font-mono text-lg font-medium outline-none focus-visible:outline-none"
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        placeholder={country.dial === '1' ? '415 555 0123' : 'Phone number'}
        value={value}
        onChange={e => onChange(formatNational(e.target.value, country.dial))}
        autoFocus={autoFocus}
      />
    </div>
  );
}

/**
 * Code field: six boxes (mono 600 26). One real input sits on top, so paste and one-time-code
 * autofill fill all six. The active box gets the brand border and ring.
 */
export function CodeField({ value, onChange, error, disabled }: {
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  disabled?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <div className="relative grid max-w-sm grid-cols-6 gap-2">
        {Array.from({ length: 6 }, (_, i) => {
          const active = focused && (i === value.length || (i === 5 && value.length === 6));
          return (
            <span
              key={i}
              aria-hidden
              className={`grid h-14 place-items-center rounded-control border-[1.5px] bg-surface font-mono text-[26px] font-semibold transition-[border-color,box-shadow] duration-200 ease-ui ${
                error ? 'border-stop' : active ? 'border-2 border-brand ring-4 ring-brand-tint' : 'border-line-strong'
              }`}
            >
              {value[i] ?? (active ? <span className="h-7 w-0.5 animate-pulse bg-brand" /> : '')}
            </span>
          );
        })}
        <input
          aria-label="6-digit code"
          aria-invalid={!!error}
          className="absolute inset-0 h-full w-full cursor-text opacity-0"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          value={value}
          disabled={disabled}
          onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoFocus
        />
      </div>
      {error && (
        <p role="alert" className="mt-2.5 flex gap-1.5 text-[13px] font-medium text-stop">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  );
}
