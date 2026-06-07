import useDragging from "@notes/hooks/use-dragging";
import useElementFrame from "@notes/hooks/use-element-frame";
import { cn } from "@notes/utils/css-utils";
import { clamp } from "@notes/utils/math-utils";
import { debounce } from "@notes/utils/object-utils";
import { useEffect, useRef, useState } from "react";

interface SliderProps {
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  onChange?: (value: number) => void;
  className?: string;
}

const Slider = ({
  min = 0,
  max = 100,
  step = 1,
  value: controlledValue = min,
  onChange,
  className,
}: SliderProps) => {
  const [value, setValue] = useState(controlledValue);
  const ADJUSTMENT_DEBOUNCE_TIME = 500;
  const debouncedOnChange = useRef(
    debounce((val: number) => onChange?.(val), ADJUSTMENT_DEBOUNCE_TIME)
  ).current;

  const sliderRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const sliderFrame = useElementFrame(sliderRef);
  const { handleMouseDown } = useDragging({
    onMove: (_point, dx) => {
      if (!sliderFrame) return;
      const newValue = clamp(
        value + Math.round(((dx / sliderFrame.width) * (max - min)) / step) * step,
        min,
        max
      );
      setValue(newValue);
      debouncedOnChange(newValue);
    },
  });

  useEffect(() => {
    setValue(controlledValue);
  }, [controlledValue]);

  return (
    <div
      className={cn("relative h-[0.375rem] bg-gray-300 rounded-full", className)}
      ref={sliderRef}
      onClick={e => {
        if (!sliderRef.current || !sliderFrame) return;
        const rect = sliderRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        let newValue = min + (x / rect.width) * (max - min);
        newValue = clamp(Math.round(newValue / step) * step, min, max);
        setValue(newValue);
        debouncedOnChange(newValue);
      }}
    >
      <div
        className="bg-gradient-to-r from-blue-300/80 to-blue-700/80 absolute rounded-full left-0 top-0 h-full w-full"
        style={{
          clipPath: `inset(0% ${((max - value) / (max - min)) * 100}% 0% 0%)`,
        }}
      />
      <div
        className="absolute top-1/2 size-3 bg-blue-700 rounded-full transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
        ref={knobRef}
        style={{ left: `${((value - min) / (max - min)) * 100}%` }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
      />
    </div>
  );
};

export default Slider;
