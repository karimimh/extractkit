"use client";

import { cn } from "@notes/utils/css-utils";
import { clamp } from "@notes/utils/math-utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";
import Button from "../button";

interface InputWithChevronsProps {
  className?: string;
  onChange?: (value: number) => void;
  initialValue?: number;
  min?: number;
  max?: number;
}

const InputWithChevrons = ({
  className,
  initialValue = 0,
  onChange,
  max,
  min,
}: InputWithChevronsProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [value, setValue] = useState(initialValue);

  const handleValueChange = (newValue: number) => {
    const clampedValue = clamp(newValue, min ?? -Infinity, max ?? Infinity);
    setValue(clampedValue);
    if (onChange) onChange(clampedValue);
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.replace(/\D/g, "");
    const numericValue = newValue === "" ? 0 : parseInt(newValue, 10);
    handleValueChange(numericValue);
  };

  const incrementValue = () => {
    const newValue = value + 1;
    handleValueChange(newValue);
  };

  const decrementValue = () => {
    const newValue = value - 1;
    handleValueChange(newValue);
  };

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  return (
    <div
      className={cn(
        "border border-[#d4d4d8] rounded-md flex items-stretch bg-white",
        isFocused && "outline outline-[3] outline-slate-200/70 border-gray-400",
        className
      )}
    >
      <input
        className="flex-1 h-full text-sm w-full pl-3 py-1 bg-transparent shadow-none border-none focus:outline-none"
        type="text"
        value={value}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onChange={handleInputChange}
      />
      <div className="flex flex-col items-center h-full w-5 border-l rounded-r-md">
        <Button
          icon={ChevronUp}
          iconSize="3"
          className="border-b rounded-tr-md flex-1 flex items-center justify-center w-full text-gray-400 hover:bg-slate-100 hover:text-black"
          onClick={incrementValue}
        />
        <Button
          icon={ChevronDown}
          iconSize="3"
          className="rounded-br-md flex-1 w-full flex items-center justify-center text-gray-400 hover:bg-slate-100 hover:text-black"
          onClick={decrementValue}
        />
      </div>
    </div>
  );
};

export default InputWithChevrons;
