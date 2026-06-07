import type { Note } from "@notes/types/note-types";
import type { Label } from "@notes/types/label-types";
import { Pin } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import GridLayout from "./layouts/grid-layout";

// Interface for PinnedNotesSection props
interface PinnedNotesSectionProps {
  notes: Note[];
  onNoteUpdate: (updatedNote: Note) => void;
  onNoteDelete: (noteId: number) => void;
  onRefetch: () => Promise<void>;
  onCloseAiAssistant: () => void;
  labels: Label[];
}

export const PinnedNotesSection: React.FC<PinnedNotesSectionProps> = ({
  notes,
  onNoteUpdate,
  onNoteDelete,
  onRefetch,
  onCloseAiAssistant,
  labels,
}) => {
  const pinnedScrollRef = useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  const handlePinnedScroll = useCallback(() => {
    const element = pinnedScrollRef.current;
    if (!element) return;

    const { scrollLeft, scrollWidth, clientWidth } = element;
    const isAtStart = scrollLeft <= 0;
    const isAtEnd = scrollLeft + clientWidth >= scrollWidth - 1;

    setShowLeftFade(!isAtStart);
    setShowRightFade(!isAtEnd);
  }, []);

  useEffect(() => {
    handlePinnedScroll();
  }, [notes, handlePinnedScroll]);

  const pinnedNotes = notes
    .filter(note => note.is_pinned)
    .sort((a, b) => a.pin_order - b.pin_order);

  if (pinnedNotes.length === 0) {
    return null;
  }

  return (
    <>
      <div className="mb-2">
        <div className="relative">
          {showLeftFade && (
            <div
              className="absolute left-0 top-0 bottom-4 w-16 z-10 pointer-events-none"
              style={{ background: "var(--gradient-fade-left)" }}
            />
          )}
          {showRightFade && (
            <div
              className="absolute right-0 top-0 bottom-4 w-16 z-10 pointer-events-none"
              style={{ background: "var(--gradient-fade-right)" }}
            />
          )}
          <div
            ref={pinnedScrollRef}
            onScroll={handlePinnedScroll}
            className="overflow-x-auto pb-6 pt-4 scrollbar-hide"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            <GridLayout
              className="flex min-w-max px-2"
              notes={pinnedNotes}
              onNoteUpdate={onNoteUpdate}
              onNoteDelete={onNoteDelete}
              onRefetch={onRefetch}
              onCloseAiAssistant={onCloseAiAssistant}
              labels={labels}
            >
              <h3 className="text-lg font-semibold text-[var(--text-secondary)] flex items-center">
                <Pin className="size-5 mr-2" />
                Pinned
              </h3>
            </GridLayout>
          </div>
        </div>
      </div>
      <hr className="border-t-2 border-[var(--border-secondary)] mb-8" />
    </>
  );
};
