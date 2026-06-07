import React from "react";
import { cn } from "@notes/utils/css-utils";

interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

interface RadioGroupProps {
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  name: string;
  className?: string;
  disabled?: boolean;
  optionClassName?: string;
}

const RadioGroup: React.FC<RadioGroupProps> = ({
  options,
  value,
  onChange,
  name,
  className,
  disabled = false,
  optionClassName,
}) => {
  return (
    <div className={cn(className)}>
      {options.map(option => (
        <label
          key={option.value}
          className={cn(
            "relative flex items-start p-3 border rounded-lg cursor-pointer transition-all duration-200",
            "hover:bg-gray-50 hover:border-gray-300",
            "focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2",
            value === option.value ? "border-blue-500 bg-blue-50" : "border-gray-200",
            disabled && "opacity-50 cursor-not-allowed",
            optionClassName
          )}
        >
          <div className="flex items-center h-5">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={e => onChange(e.target.value)}
              disabled={disabled}
              className="sr-only"
            />
            <div
              className={cn(
                "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-200",
                value === option.value ? "border-blue-500 bg-blue-500" : "border-gray-300 bg-white"
              )}
            >
              {value === option.value && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
          </div>
          <div className="ml-3 flex-1">
            <div
              className={cn(
                "text-sm font-medium transition-colors duration-200",
                value === option.value ? "text-blue-900" : "text-gray-900"
              )}
            >
              {option.label}
            </div>
            {option.description && (
              <div
                className={cn(
                  "text-xs mt-1 transition-colors duration-200",
                  value === option.value ? "text-blue-700" : "text-gray-500"
                )}
              >
                {option.description}
              </div>
            )}
          </div>
        </label>
      ))}
    </div>
  );
};

export default RadioGroup;
