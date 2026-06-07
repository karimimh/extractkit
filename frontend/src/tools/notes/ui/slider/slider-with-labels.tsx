import { cn } from "@notes/utils/css-utils";
import { debounce } from "@notes/utils/object-utils";
import { RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Button from "../button";
import Slider from "./slider";

export interface SliderWithLabelsProps {
  label?: string;
  className?: string;
  min?: number;
  max?: number;
  step?: number;
  value: number;
  onChange?: (value: number) => void;
  resetValue?: number;
}

const SliderWithLabels = ({
  label,
  className = "",
  min,
  max,
  step = 1,
  onChange,
  value,
  resetValue,
}: SliderWithLabelsProps) => {
  const [uncontrolledValue, setUncontrolledValue] = useState<number>(value);

  const ADJUSTMENT_DEBOUNCE_TIME = 500;
  const debouncedOnChange = useRef(
    debounce((val: number) => onChange?.(val), ADJUSTMENT_DEBOUNCE_TIME)
  );

  const handleChange = (val: number) => {
    debouncedOnChange.current(val);
    setUncontrolledValue(val);
  };

  useEffect(() => {
    setUncontrolledValue(value);
  }, [value]);
  return (
    <div className={cn("flex flex-col items-start justify-center gap-1", className)}>
      {label ? (
        <div className="w-full flex flex-row items-center justify-start gap-2 [&>button]:hidden [&:hover>button]:block">
          <div className="flex-1 text-sm truncate max-w-[calc(100%-28px)]">{label}</div>
          {resetValue !== undefined && (
            <Button icon={RotateCcw} iconSize="3" onClick={() => handleChange(resetValue)} />
          )}
          <div className="text-xs font-bold w-[20px] mr-2">{uncontrolledValue}</div>
        </div>
      ) : null}
      <div className="flex flex-row items-center gap-3 w-full">
        <span className="text-xs text-right text-gray-500 min-w-7">{min}</span>
        <Slider
          className="flex-1"
          max={max}
          min={min}
          onChange={handleChange}
          step={step}
          value={uncontrolledValue}
        />
        <span className="text-xs text-left text-gray-500 min-w-7">{max}</span>
      </div>
    </div>
  );
};

export default SliderWithLabels;
