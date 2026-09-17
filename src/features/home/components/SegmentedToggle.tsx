'use client';

interface SegmentedToggleProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}

// Small pill-group toggle used to switch a chart's breakdown (e.g. Total / By regulator / By
// sector) — kept local to Executive Home; promote via common-function-rule if a second feature
// needs the identical control.
export function SegmentedToggle<T extends string>({ value, onChange, options }: SegmentedToggleProps<T>) {
  return (
    <div className="inline-flex shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`h-7 rounded-full px-3 text-[11.5px] font-semibold transition-colors ${
            value === o.value ? 'bg-dune text-white shadow-soft' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
