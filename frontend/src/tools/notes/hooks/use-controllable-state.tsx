import { useEffect, useState, useRef } from "react";

const useControllableState = <T,>(
  controlledValue?: T,
  controlledOnChange?: (value: T) => void,
  defaultValue?: T,
  onChangeDelay?: (newValue: T) => number
): [T, (value: T) => void] => {
  const [value, setValue] = useState<T>((controlledValue ?? defaultValue) as T);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (controlledValue !== undefined) {
      setValue(controlledValue);
    }
  }, [controlledValue]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleChange = (newValue: T) => {
    setValue(newValue);

    if (controlledOnChange) {
      // Clear any pending timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (onChangeDelay) {
        const delay = onChangeDelay(newValue);
        if (delay <= 0) {
          controlledOnChange(newValue);
        } else {
          timeoutRef.current = setTimeout(() => {
            controlledOnChange(newValue);
            timeoutRef.current = null;
          }, delay);
        }
      } else {
        controlledOnChange(newValue);
      }
    }
  };

  return [value, handleChange];
};

export default useControllableState;
