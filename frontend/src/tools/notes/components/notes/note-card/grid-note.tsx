import { useTheme } from "@notes/context/ThemeContext";
import { useIsMobile } from "@notes/hooks/use-is-mobile";
import type { Note } from "@notes/types/note-types";
import type { Label } from "@notes/types/label-types";
import HeroDialog, { type HeroDialogRef } from "@notes/ui/dialog/hero-dialog";
import { apiClient } from "@notes/utils/api";
import { cn } from "@notes/utils/css-utils";
import { getNoteColorStyles } from "@notes/utils/note-colors";
import React, { useCallback, useState } from "react";
import NoteDetails from "../note-details/note-details";
import NotePreview from "./note-preview";

interface GridNoteProps {
  note: Note;
  cellWidth?: number;
  onNoteUpdate?: (updatedNote: Note) => void;
  onNoteDelete?: (noteId: number) => void;
  onRefetch?: (force?: boolean) => void;
  onCloseAiAssistant?: () => void;
  labels: Label[];
}

const GridNote: React.FC<GridNoteProps> = ({
  note,
  cellWidth,
  onNoteUpdate,
  onNoteDelete,
  onRefetch,
  onCloseAiAssistant,
  labels,
}) => {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";
  const ref = React.useRef<HeroDialogRef>(null);
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [isOpenTimed, setIsOpenTimed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [enableSyntaxHighlighting, setEnableSyntaxHighlighting] = useState(false);

  const triggerStyle: React.CSSProperties = {
    width: cellWidth,
    height: cellWidth,
  };
  const dialogStyle: React.CSSProperties = {
    ...getNoteColorStyles(note, isDarkMode),
    width: isMaximized || isMobile ? window.innerWidth : window.innerWidth * 0.8,
    height: isMaximized || isMobile ? window.innerHeight : window.innerHeight * 0.8,
    overflow: "hidden",
    borderRadius: isMaximized || isMobile ? 0 : 16,
  };

  const handlePinToggle = useCallback(
    async (e?: React.MouseEvent) => {
      e?.stopPropagation();
      try {
        const response = await apiClient.notes.pinNote(note.id);
        if (onNoteUpdate) {
          onNoteUpdate({
            ...note,
            is_pinned: response.is_pinned,
            pin_order: response.pin_order,
          });
        }
        // Force refetch to update the list order (pinned notes should be at the top)
        if (onRefetch) {
          onRefetch(true);
        }
      } catch (error) {
        console.error("Failed to toggle pin:", error);
      }
    },
    [note, onNoteUpdate, onRefetch]
  );

  return (
    <HeroDialog
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      isOpenTimed={isOpenTimed}
      setIsOpenTimed={setIsOpenTimed}
      onOpenChange={isOpen => {
        if (!isOpen) {
          setEnableSyntaxHighlighting(false);
          onRefetch?.();
        } else {
          setEnableSyntaxHighlighting(true);
          onCloseAiAssistant?.();
        }
      }}
      triggerStyle={triggerStyle}
      triggerClassName={cn(
        "rounded-2xl transition-all duration-300 ease-out",
        "shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08),0_4px_16px_-4px_rgba(0,0,0,0.12)]",
        "hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.15),0_12px_32px_-8px_rgba(0,0,0,0.18)]",
        "hover:-translate-y-1",
        "ring-1 ring-black/[0.04] dark:ring-white/[0.08]",
        "overflow-hidden"
      )}
      dialogStyle={dialogStyle}
      ref={ref}
      setIsHovered={setIsHovered}
    >
      {isOpenTimed ? (
        <NoteDetails
          note={note}
          onNoteUpdate={onNoteUpdate}
          onNoteDelete={(noteId: number) => {
            onNoteDelete?.(noteId);
            ref.current?.handleOpenChange(false);
          }}
          onClose={() => ref.current?.handleOpenChange(false)}
          isMaximized={isMaximized}
          onMaximize={() => setIsMaximized(prev => !prev)}
          onPinToggle={handlePinToggle}
          hideMaximizeButton={isMobile}
          disableSyntaxHighlighting={!enableSyntaxHighlighting}
          labels={labels}
          onRefetch={onRefetch}
        />
      ) : (
        <NotePreview
          isNoteHovered={isHovered}
          note={note}
          onPinToggle={handlePinToggle}
          onNoteDelete={onNoteDelete}
          labels={labels}
          onRefetch={onRefetch}
        />
      )}
    </HeroDialog>
  );
};

export default GridNote;
