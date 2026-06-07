
import { cn } from "@images/utils/css-utils";
import { clamp } from "@images/utils/math-utils";
import { Minus, Plus, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import Button from "../button";

interface NumberInputProps {
  className?: string;
  onChange?: (value?: number) => void;
  value?: number;
  min?: number;
  max?: number;
  base?: "10" | "16";
  look?: "default" | "with-plus-minus";
  leadingLabel?: string;
  showTrailingClear?: boolean;
  zeroPadLength?: number;
  leadingOptions?: string[];
  leadingOption?: string;
  onLeadingOptionChange?: (option: string) => void;
}

const NumberInput = ({
  className,
  value: initialValue,
  onChange,
  max,
  min,
  base = "10",
  look = "default",
  leadingLabel,
  showTrailingClear = false,
  zeroPadLength,
  leadingOptions,
  leadingOption: initialLeadingOption,
  onLeadingOptionChange,
}: NumberInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [value, setValue] = useState(initialValue);
  const [leadingOption, setLeadingOption] = useState<string | undefined>(
    initialLeadingOption
  );

  const handleValueChange = (newValue?: number) => {
    const clampedValue = newValue
      ? clamp(newValue, min ?? -Infinity, max ?? Infinity)
      : undefined;
    setValue(clampedValue);
    if (onChange) onChange(clampedValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.replace(
      base === "10" ? /\D/g : /[^0-9a-fA-F]/g,
      ""
    );
    const numericValue =
      newValue === "" ? min ?? 0 : parseInt(newValue, parseInt(base));
    handleValueChange(numericValue);
  };

  const incrementValue = () => {
    if (value === undefined) return;
    const newValue = value + 1;
    handleValueChange(newValue);
  };

  const decrementValue = () => {
    if (value === undefined) return;
    const newValue = value - 1;
    handleValueChange(newValue);
  };

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    setLeadingOption(initialLeadingOption);
  }, [initialLeadingOption]);

  return (
    <div
      className={cn(
        "border border-[#d4d4d8] rounded-md flex items-center bg-white relative",
        isFocused && "outline outline-[3] outline-slate-200/70 border-gray-400",
        className
      )}
    >
      {look === "with-plus-minus" && (
        <Button
          icon={Minus}
          iconSize="3"
          className="border-r rounded-l-md h-full min-w-4 aspect-square flex items-center justify-center text-gray-400 hover:bg-slate-100 hover:text-black"
          onClick={decrementValue}
        />
      )}
      {leadingOptions && look === "default" && (
        <select
          className="text-xs bg-transparent uppercase shadow-none h-full text-gray-500 border-r focus:outline-none"
          value={leadingOption}
          onChange={(e) => {
            setLeadingOption(e.target.value);
            onLeadingOptionChange?.(e.target.value);
          }}
        >
          {leadingOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      )}
      {leadingLabel && (
        <span className="pointer-events-none w-fit pl-2 flex items-center justify-end text-sm text-muted-foreground peer-disabled:opacity-50">
          {leadingLabel}
        </span>
      )}

      <input
        className={cn(
          "flex-1 w-full h-full text-sm px-1 py-1 bg-transparent uppercase shadow-none border-none focus:outline-none",
          look === "with-plus-minus" && "text-center"
        )}
        type="text"
        value={
          (zeroPadLength
            ? value?.toString(parseInt(base)).padStart(zeroPadLength, "0")
            : value?.toString(parseInt(base))) ?? ""
        }
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onChange={handleInputChange}
      />
      {look === "with-plus-minus" && (
        <Button
          icon={Plus}
          iconSize="3"
          className="border-l rounded-r-md h-full min-w-4 flex items-center justify-center aspect-square text-gray-400 hover:bg-slate-100 hover:text-black"
          onClick={incrementValue}
        />
      )}
      {showTrailingClear && (
        <XCircle
          className="size-4 mr-1 text-gray-500 cursor-pointer"
          onClick={() => handleValueChange(undefined)}
        />
      )}
    </div>
  );
};

export default NumberInput;
