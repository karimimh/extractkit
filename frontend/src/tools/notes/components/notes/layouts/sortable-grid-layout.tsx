import type { Note } from "@notes/types/note-types";
import type { Label } from "@notes/types/label-types";
import { apiClient } from "@notes/utils/api";
import { cn } from "@notes/utils/css-utils";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import React, { useEffect, useRef, useState } from "react";
import GridNote from "../note-card/grid-note.tsx";
import { SortableNoteItem } from "./sortable-note-item.tsx";

interface SortableGridLayoutProps {
  notes: Note[];
  gap?: number;
  className?: string;
  onNoteUpdate?: (updatedNote: Note) => void;
  onNoteDelete?: (noteId: number) => void;
  onRefetch?: (force?: boolean) => void;
  onCloseAiAssistant?: () => void;
  onDragComplete?: () => void;
  labels: Label[];
}

const SortableGridLayout: React.FC<SortableGridLayoutProps> = ({
  notes,
  gap = 12,
  className,
  onNoteUpdate,
  onNoteDelete,
  onRefetch,
  onCloseAiAssistant,
  onDragComplete,
  labels,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [localNotes, setLocalNotes] = useState(notes);
  const [isSaving, setIsSaving] = useState(false);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    // Only sync from parent if we're not currently dragging
    if (!isDraggingRef.current) {
      setLocalNotes(notes);
    }
  }, [notes]);

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

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    isDraggingRef.current = false;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = localNotes.findIndex(note => note.id === active.id);
    const newIndex = localNotes.findIndex(note => note.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Perform optimistic UI update
    const reorderedNotes = arrayMove(localNotes, oldIndex, newIndex);
    setLocalNotes(reorderedNotes);

    setIsSaving(true);
    try {
      // Only send the dragged note ID and target note ID
      await apiClient.notes.reorderNote(Number(active.id), Number(over.id));

      // Notify parent that drag was completed
      onDragComplete?.();

      // // Refetch to get the correct server state
      // onRefetch?.(true);
    } catch (error) {
      console.error("Failed to reorder note:", error);
      // Revert to original order on error
      setLocalNotes(notes);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDragStart = () => {
    isDraggingRef.current = true;
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={localNotes.map(note => note.id)} strategy={rectSortingStrategy}>
        <div
          ref={containerRef}
          className={cn(
            "grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] relative",
            className,
            isSaving && "opacity-70"
          )}
          style={{
            gap: `${gap}px`,
          }}
        >
          {localNotes?.map(note => (
            <SortableNoteItem key={note.id} id={note.id}>
              <GridNote
                note={note}
                onNoteUpdate={onNoteUpdate}
                onNoteDelete={onNoteDelete}
                onRefetch={onRefetch}
                onCloseAiAssistant={onCloseAiAssistant}
                cellWidth={cellWidth}
                labels={labels}
              />
            </SortableNoteItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default SortableGridLayout;
