import type { ReactNode } from "react";

export type SwitchOption<T extends string> = {
  label: ReactNode;
  value: T;
};

type SwitchProps<T extends string> = {
  label?: ReactNode;
  onChange: (value: T) => void;
  options: readonly SwitchOption<T>[];
  value: T;
};

export function Switch<T extends string>({ label, onChange, options, value }: SwitchProps<T>) {
  return (
    <div className="toggle-group">
      {label && <span>{label}</span>}
      <div className="toggle-buttons">
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
