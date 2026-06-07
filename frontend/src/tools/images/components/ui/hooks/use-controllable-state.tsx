import { useEffect, useState } from "react";

const useControllableState = <T,>(
  controlledValue?: T,
  controlledOnChange?: (value: T) => void,
  defaultValue?: T
): [T, (value: T) => void] => {
  const [value, setValue] = useState<T>((controlledValue ?? defaultValue) as T);

  useEffect(() => {
    if (controlledValue !== undefined) {
      setValue(controlledValue);
    }
  }, [controlledValue]);

  const handleChange = (newValue: T) => {
    if (controlledOnChange) {
      controlledOnChange(newValue);
    } else {
      setValue(newValue);
    }
  };

  return [value, handleChange];
};

export default useControllableState;
