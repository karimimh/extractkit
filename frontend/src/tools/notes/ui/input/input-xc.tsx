import { Check, X } from "lucide-react";
import { forwardRef, type KeyboardEvent, useRef, useState } from "react";
import Button from "../button";

interface InputXCProps {
  initialText?: string;
  onApply?: (text?: string) => void;
  onCancel?: () => void;
}

const InputXC = forwardRef<HTMLInputElement, InputXCProps>(
  ({ onApply, onCancel, initialText }, ref) => {
    const [inputText, setInputText] = useState<string | undefined>(initialText);
    const cancelRef = useRef(null);
    const applyRef = useRef(null);

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") onApply?.(inputText);
      else if (e.key === "Escape") onCancel?.();
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const t = e.relatedTarget as HTMLElement;
      if (t === applyRef.current || t === cancelRef.current) return;
      onCancel?.();
    };

    return (
      <div className="ml-6 mr-1 h-8 relative bg-white border rounded-md">
        <Button
          className="absolute left-0 top-0 rounded-l-md rounded-r-[unset] p-0 h-full px-1 text-red-600"
          icon={X}
          iconSize="5"
          onClick={onCancel}
          variant="ghost"
          ref={cancelRef}
        />
        <input
          value={inputText ?? ""}
          className="px-9 rounded-md w-full h-full"
          onBlur={handleBlur}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          ref={ref}
        />
        <Button
          className="absolute right-0 top-0 rounded-r-md rounded-l-[unset] p-0 h-full px-1 text-blue-600"
          icon={Check}
          iconSize="5"
          onClick={() => onApply?.(inputText)}
          variant="ghost"
          ref={applyRef}
        />
      </div>
    );
  }
);

InputXC.displayName = "Input";

export default InputXC;
