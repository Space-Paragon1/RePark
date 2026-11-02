'use client';

/** Segmented control (components.md): sunken track, 1 px line, radius 10; the choice sits on surface. */
export function Segmented<T extends string>({ name, label, options, value, onChange }: {
  name: string;
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-semibold">{label}</legend>
      <div className="flex rounded-control border border-line bg-surface-sunken p-[3px]">
        {options.map(option => {
          const selected = option.value === value;
          return (
            <label
              key={option.value}
              className={`flex h-10 flex-1 cursor-pointer items-center justify-center whitespace-nowrap rounded-[7px] px-1.5 text-center text-[13px] sm:px-2 sm:text-sm transition-colors duration-200 ease-ui has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand ${
                selected ? 'bg-surface font-bold text-text shadow-[0_1px_2px_rgba(13,17,23,0.1)]' : 'font-semibold text-text-secondary hover:text-text'
              }`}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
