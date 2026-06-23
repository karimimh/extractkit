import type { ReactNode } from "react";

export type SegmentedControlOption<T extends string> = {
  label: ReactNode;
  value: T;
};

type SegmentedControlProps<T extends string> = {
  label?: ReactNode;
  onChange: (value: T) => void;
  options: readonly SegmentedControlOption<T>[];
  value: T;
};

export function SegmentedControl<T extends string>({ label, onChange, options, value }: SegmentedControlProps<T>) {
  return (
    <div className="segmented-control">
      {label && <span>{label}</span>}
      <div className="segmented-control-options">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={value === option.value ? "active" : ""}
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
