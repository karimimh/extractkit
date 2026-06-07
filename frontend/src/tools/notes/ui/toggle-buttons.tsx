import React from "react";

interface ToggleOption {
  value: string;
  label: string;
}

interface ToggleButtonsProps {
  options: ToggleOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

const ToggleButtons: React.FC<ToggleButtonsProps> = ({
  options,
  value,
  onChange,
  label,
  className = "",
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {label && <span className="text-sm text-gray-600">{label}</span>}
      {options.map(option => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            value === option.value
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default ToggleButtons;
