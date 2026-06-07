"use client";

import { cn } from "@notes/utils/css-utils";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";

interface AutogrowingTextareaProps {
  onChange?: (value: string) => void;
  onFocus?: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onScroll?: (event: React.UIEvent<HTMLTextAreaElement>) => void;
  value?: string;
  className?: string;
  minRows?: number;
  maxRows?: number;
  placeholder?: string;
  id?: string;
  dir?: "ltr" | "rtl";
  style?: React.CSSProperties;
}

export interface AutogrowingTextareaHandle {
  focus: () => void;
}

const AutogrowingTextarea = forwardRef<AutogrowingTextareaHandle, AutogrowingTextareaProps>(
  (
    {
      onChange,
      onFocus,
      onBlur,
      onKeyDown,
      onScroll,
      value = "",
      className,
      minRows,
      maxRows,
      placeholder,
      id,
      dir,
      style,
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
      const borderHeight = parseInt(style.borderTopWidth) + parseInt(style.borderBottomWidth);
      const paddingHeight = parseInt(style.paddingTop) + parseInt(style.paddingBottom);

      const lineHeight = parseInt(style.lineHeight);
      const maxHeight = maxRows ? lineHeight * maxRows + borderHeight + paddingHeight : Infinity;

      const minHeight = minRows ? lineHeight * minRows + borderHeight + paddingHeight : 0;
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
          "border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-md h-11 px-2 min-h-[none] resize-none focus:outline focus:outline-slate-200/70 focus:border-[var(--border-secondary)]",
          className
        )}
        id={id}
        placeholder={placeholder}
        ref={textAreaRef}
        rows={1}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        onScroll={onScroll}
        onChange={e => {
          setText(e.target.value);
          onChange?.(e.target.value);
          handleInput();
        }}
        value={text}
        dir={dir}
        style={style}
      />
    );
  }
);

AutogrowingTextarea.displayName = "AutogrowingTextarea";

export default AutogrowingTextarea;
