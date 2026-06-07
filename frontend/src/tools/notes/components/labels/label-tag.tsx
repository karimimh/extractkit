"use client";

import type { NoteLabel } from "@notes/types/note-types";
import { cn } from "@notes/utils/css-utils";

interface LabelTagProps {
  label: NoteLabel;
  className?: string;
  style?: React.CSSProperties;
}

const LabelTag = ({ label, className, style = {} }: LabelTagProps) => {
  return (
    <div
      className={cn(
        "w-16 text-center px-2.5 py-1 text-xs font-medium truncate shadow-md whitespace-nowrap border-l border-[var(--border-primary)] rounded-xl",
        className
      )}
      style={{
        backgroundColor: label.color,
        ...style,
      }}
      title={label.name}
    >
      {label.name}
    </div>
  );
};

export default LabelTag;
