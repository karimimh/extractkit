import { cn } from "@images/utils/css-utils";
import { clamp } from "@images/utils/math-utils";
import { useEffect, useState } from "react";
import ColorPickerPopover from "./color/color-picker-popover";
import InputWithChevrons from "./input/input-with-chevrons";
import Select from "./select";
import SliderWithLabels from "./slider/slider-with-labels";
import Switch from "./switch";
import { Param } from "@images/types/ui-types";

interface ControlFactoryProps {
  param: Param;
  value: any;
  onChange?: (value: any) => void;
  className?: string;
}

interface RealNumberInputProps {
  className?: string;
  onChange?: (value: number) => void;
  value?: number;
  min?: number;
  max?: number;
  label?: string;
}

const RealNumberInput = ({
  className,
  value: initialValue,
  onChange,
  max,
  min,
  label,
}: RealNumberInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [value, setValue] = useState(initialValue?.toString() ?? "");

  const handleValueChange = (newValue: string) => {
    setValue(newValue);
    const numericValue = parseFloat(newValue);
    if (!isNaN(numericValue)) {
      const clampedValue = clamp(numericValue, min ?? -Infinity, max ?? Infinity);
      onChange?.(clampedValue);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    // Allow numbers, decimal point, and minus sign
    if (newValue === "" || /^-?\d*\.?\d*$/.test(newValue)) {
      handleValueChange(newValue);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue)) {
      const clampedValue = clamp(numericValue, min ?? -Infinity, max ?? Infinity);
      setValue(clampedValue.toString());
      onChange?.(clampedValue);
    } else if (value === "" || value === "-") {
      setValue(min?.toString() ?? "0");
      onChange?.(min ?? 0);
    }
  };

  useEffect(() => {
    setValue(initialValue?.toString() ?? "");
  }, [initialValue]);

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {label && <label className="text-sm">{label}</label>}
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={handleInputChange}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        className={cn(
          "border border-[#d4d4d8] rounded-md px-2 h-7 bg-white",
          isFocused && "outline outline-[3] outline-slate-200/70 border-gray-400"
        )}
      />
    </div>
  );
};

const ControlFactory = ({ param, onChange, value, className }: ControlFactoryProps) => {
  if (param.type === "slider") {
    return (
      <SliderWithLabels
        className={className}
        max={param.max}
        min={param.min}
        label={param.label || param.name}
        value={value as number}
        onChange={onChange}
        step={param.step}
        resetValue={param.defaultValue ?? undefined}
      />
    );
  } else if (param.type === "color") {
    return (
      <div className={cn("flex flex-col gap-1", className)}>
        {param.label && <label className="text-sm">{param.label || param.name}</label>}
        <ColorPickerPopover value={value as string} onChange={onChange} />
      </div>
    );
  } else if (param.type === "real-number") {
    return (
      <RealNumberInput
        className={className}
        value={value as number | undefined}
        onChange={onChange}
        min={param.min}
        max={param.max}
        label={param.label || param.name}
      />
    );
  } else if (param.type === "integer-number") {
    return (
      <div className={cn("flex flex-col gap-1", className)}>
        {param.label && <label className="text-sm">{param.label || param.name}</label>}
        <InputWithChevrons
          initialValue={value as number | undefined}
          onChange={onChange}
          min={param.min}
          max={param.max}
        />
      </div>
    );
  } else if (param.type === "select") {
    return (
      <div className={cn("flex flex-col gap-1", className)}>
        {param.label && <label className="text-sm">{param.label || param.name}</label>}
        <Select
          trigger={(value as string) ?? param.defaultValue ?? "Select..."}
          items={param.options.map(opt => opt.value)}
          onSelect={onChange}
          contentClassName="text-base"
          triggerClassName="w-full text-sm"
        />
      </div>
    );
  } else if (param.type === "boolean") {
    return (
      <div className={cn("flex flex-row items-center gap-2", className)}>
        {param.label && <label className="text-sm">{param.label || param.name}</label>}
        <Switch isOn={!!value} onToggle={onChange} />
      </div>
    );
  }

  return null;
};

export default ControlFactory;
