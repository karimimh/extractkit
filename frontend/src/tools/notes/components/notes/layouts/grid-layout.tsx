import type { Note } from "@notes/types/note-types";
import type { Label } from "@notes/types/label-types";
import { cn } from "@notes/utils/css-utils";
import React, { useEffect, useRef, useState } from "react";
import GridNote from "../note-card/grid-note";

interface GridLayoutProps {
  notes: Note[];
  gap?: number;
  className?: string;
  onNoteUpdate?: (updatedNote: Note) => void;
  onNoteDelete?: (noteId: number) => void;
  onRefetch?: (force?: boolean) => void;
  onCloseAiAssistant?: () => void;
  children?: React.ReactNode;
  labels: Label[];
}

const GridLayout: React.FC<GridLayoutProps> = ({
  notes,
  gap = 12,
  className,
  onNoteUpdate,
  onNoteDelete,
  onRefetch,
  onCloseAiAssistant,
  children,
  labels,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cellWidth, setCellWidth] = useState<number>(300);

  useEffect(() => {
    const updateCellWidth = () => {
      if (containerRef.current) {
        const computedStyle = window.getComputedStyle(containerRef.current);
        const gridTemplateColumns = computedStyle.gridTemplateColumns;
        const columns = gridTemplateColumns.split(" ");

        if (columns.length > 0) {
          const firstColumnWidth = parseFloat(columns[0]);
          if (!isNaN(firstColumnWidth)) {
            setCellWidth(firstColumnWidth);
          }
        }
      }
    };

    updateCellWidth();

    const resizeObserver = new ResizeObserver(updateCellWidth);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [notes]);

  return (
    <div
      ref={containerRef}
      className={cn("grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))]", className)}
      style={{
        gap: `${gap}px`,
      }}
    >
      {children}
      {notes?.map(note => (
        <GridNote
          key={note.id}
          note={note}
          cellWidth={cellWidth}
          onNoteUpdate={onNoteUpdate}
          onNoteDelete={onNoteDelete}
          onRefetch={onRefetch}
          onCloseAiAssistant={onCloseAiAssistant}
          labels={labels}
        />
      ))}
    </div>
  );
};

export default GridLayout;
