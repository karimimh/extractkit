
import { Check, X } from "lucide-react";
import { FocusEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import Button from "./button";
import { cn } from "@images/utils/css-utils";

interface CountInputProps {
  value?: number;
  min?: number;
  max?: number;
  onChange?: (v?: number) => void;
  className?: string;
}

const CountInput = ({
  value,
  max,
  min,
  onChange: onValueChange,
  className,
}: CountInputProps) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const applyRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleApply = () => {
    setIsEditing(false);
    if (inputRef.current) {
      onValueChange?.(Number(inputRef.current.value));
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleApply();
    else if (e.key === "Escape") handleCancel();
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    const t = e.relatedTarget as HTMLElement;
    if (t === applyRef.current || t === cancelRef.current) return;
    handleCancel?.();
  };

  return isEditing ? (
    <div
      className={cn(
        "h-8 relative bg-white border rounded-md",
        className
      )}
    >
      <Button
        className="absolute left-0 top-0 rounded-l-md rounded-r-[unset] p-0 h-full px-1 text-red-600"
        icon={X}
        onClick={handleCancel}
        variant="ghost"
        ref={cancelRef}
      />
      <input
        className="w-full px-6 h-full rounded-md"
        ref={inputRef}
        type="number"
        defaultValue={value}
        min={min}
        max={max}
        step={1}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />
      <Button
        icon={Check}
        variant="ghost"
        className="absolute right-0 top-0 rounded-r-md rounded-l-[unset] p-0 h-full px-1 text-blue-600"
        onClick={handleApply}
        ref={applyRef}
      />
    </div>
  ) : (
    <span
      className="text-xs font-bold cursor-pointer hover:bg-stone-200"
      onClick={() => setIsEditing(true)}
    >
      {value}
    </span>
  );
};

export default CountInput;
