
import { cn } from "@images/utils/css-utils";
import { clamp } from "@images/utils/math-utils";
import { Minus, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import Button from "../button";

interface InputWithPlusMinusProps {
  className?: string;
  onChange?: (value: number) => void;
  initialValue?: number;
  min?: number;
  max?: number;
}

const InputWithPlusMinus = ({
  className,
  initialValue = 0,
  onChange,
  max,
  min,
}: InputWithPlusMinusProps) => {
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
        "border border-[#d4d4d8] rounded-md flex items-center gap-2 bg-white",
        isFocused && "outline outline-[3] outline-slate-200/70 border-gray-400",
        className
      )}
    >
      <Button
        icon={Minus}
        iconSize="3"
        className="border-r rounded-l-md h-full min-w-4 aspect-square flex items-center justify-center text-gray-400 hover:bg-slate-100 hover:text-black"
        onClick={decrementValue}
      />
      <input
        className="flex-1 w-full h-full text-sm px-1 py-1 bg-transparent shadow-none border-none focus:outline-none text-center"
        type="text"
        value={value}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onChange={handleInputChange}
      />
      <Button
        icon={Plus}
        iconSize="3"
        className="border-l rounded-r-md h-full min-w-4 flex items-center justify-center aspect-square text-gray-400 hover:bg-slate-100 hover:text-black"
        onClick={incrementValue}
      />
    </div>
  );
};

export default InputWithPlusMinus;
