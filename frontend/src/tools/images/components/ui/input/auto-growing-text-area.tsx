
import { cn } from "@images/utils/css-utils";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

interface AutogrowingTextareaProps {
  onChange?: (value: string) => void;
  value?: string;
  className?: string;
  minRows?: number;
  maxRows?: number;
  placeholder?: string;
}

export interface AutogrowingTextareaHandle {
  focus: () => void;
}

const AutogrowingTextarea = forwardRef<
  AutogrowingTextareaHandle,
  AutogrowingTextareaProps
>(
  (
    {
      onChange,
      value = "",
      className,
      minRows,
      maxRows,
      placeholder,
    }: AutogrowingTextareaProps,
    ref
  ) => {
    const [text, setText] = useState(value);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    useImperativeHandle(ref, () => ({
      focus: () => {
        textAreaRef.current?.focus();
      },
    }));

    useEffect(() => {
      setText(value);
    }, [value]);

    const handleInput = useCallback(() => {
      const textarea = textAreaRef.current;
      if (!textarea) return;
      textarea.style.height = "auto";

      const style = window.getComputedStyle(textarea);
      const borderHeight =
        parseInt(style.borderTopWidth) + parseInt(style.borderBottomWidth);
      const paddingHeight =
        parseInt(style.paddingTop) + parseInt(style.paddingBottom);

      const lineHeight = parseInt(style.lineHeight);
      const maxHeight = maxRows
        ? lineHeight * maxRows + borderHeight + paddingHeight
        : Infinity;

      const minHeight = minRows
        ? lineHeight * minRows + borderHeight + paddingHeight
        : 0;
      const newHeight = Math.min(
        Math.max(textarea.scrollHeight + borderHeight, minHeight),
        maxHeight
      );

      textarea.style.height = `${newHeight}px`;
    }, [maxRows, minRows]);

    useEffect(() => {
      handleInput();
    }, [handleInput]);

    return (
      <textarea
        className={cn(
          "border border-[#d4d4d8] bg-white rounded-md h-10 px-2 min-h-[none] resize-none focus:outline focus:outline-[3] focus:outline-slate-200/70 focus:border-gray-400",
          className
        )}
        placeholder={placeholder}
        ref={textAreaRef}
        rows={1}
        onChange={(e) => {
          setText(e.target.value);
          onChange?.(e.target.value);
          handleInput();
        }}
        value={text}
      />
    );
  }
);

AutogrowingTextarea.displayName = "AutogrowingTextarea";

export default AutogrowingTextarea;
