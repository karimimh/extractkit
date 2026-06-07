import { useTheme } from "@notes/context/ThemeContext";
import type { Note } from "@notes/types/note-types";
import type { Label } from "@notes/types/label-types";
import { getDarkModeColor } from "@notes/utils/note-colors";
import React, { useEffect, useRef, useState } from "react";
import EditNoteForm, { type EditNoteFormRef } from "../edit-note/edit-note-form";
import NoteFooter from "../note-card/note-footer";
import NoteRenderer from "../note-renderer";
import AISidebar from "./ai-sidebar";
import HistorySidebar from "./history-sidebar";
import NoteDetailsHeader from "./note-details-header";
import ScrollButtons from "./scroll-buttons";

interface NoteDetailsProps {
  note: Note;
  onNoteUpdate?: (updatedNote: Note) => void;
  onNoteDelete?: (noteId: number) => void;
  onClose: () => void;
  isMaximized?: boolean;
  onMaximize?: () => void;
  onPinToggle?: (e?: React.MouseEvent) => Promise<void>;
  hideMaximizeButton?: boolean;
  disableSyntaxHighlighting?: boolean;
  labels: Label[];
  onRefetch?: (force?: boolean) => void;
}

const NoteDetails: React.FC<NoteDetailsProps> = ({
  note,
  onNoteUpdate,
  onNoteDelete,
  onClose,
  isMaximized,
  onMaximize,
  onPinToggle,
  hideMaximizeButton = false,
  disableSyntaxHighlighting = false,
  labels,
  onRefetch,
}) => {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";
  const textColor = isDarkMode ? getDarkModeColor(note.color, note.bg_color, "text") : note.color;
  const bgColor = isDarkMode ? getDarkModeColor(note.color, note.bg_color, "bg") : note.bg_color;
  const [isEditMode, setIsEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [isAISidebarOpen, setIsAISidebarOpen] = useState(false);
  const [isHistorySidebarOpen, setIsHistorySidebarOpen] = useState(false);
  const editFormRef = useRef<EditNoteFormRef>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Reset edit mode when note changes
  useEffect(() => {
    setIsEditMode(false);
  }, [note.id, note.title]);

  useEffect(() => {
    if (isEditMode) {
      setEditTitle(note.title || "");
    }
  }, [isEditMode, note.title]);

  const handleEditCancel = () => {
    setIsEditMode(false);
  };

  const handleNoteUpdate = (updatedNote: Note) => {
    setIsEditMode(false);
    onNoteUpdate?.(updatedNote);
  };

  const handleSave = () => {
    editFormRef.current?.submit();
  };

  return (
    <div className="w-full h-full flex flex-col relative rounded-t-2xl">
      <NoteDetailsHeader
        note={note}
        onNoteUpdate={onNoteUpdate}
        onNoteDelete={onNoteDelete}
        isEditMode={isEditMode}
        setIsEditMode={setIsEditMode}
        onDialogClose={onClose}
        isMaximized={isMaximized}
        handleMaximizeClick={onMaximize}
        hideMaximizeButton={hideMaximizeButton}
        editTitle={editTitle}
        onEditTitleChange={setEditTitle}
        onToggleSidebar={() => setIsAISidebarOpen(open => !open)}
        onToggleHistory={() => setIsHistorySidebarOpen(open => !open)}
        onSave={handleSave}
        onCancel={handleEditCancel}
      />
      <div
        ref={scrollContainerRef}
        className="overflow-y-auto flex-1 w-full mt-16 flex flex-col"
        onDoubleClick={() => !isEditMode && setIsEditMode(true)}
      >
        {isEditMode ? (
          <EditNoteForm
            ref={editFormRef}
            note={note}
            onNoteUpdate={handleNoteUpdate}
            onCancel={handleEditCancel}
            editTitle={editTitle}
            onEditTitleChange={setEditTitle}
          />
        ) : (
          <NoteRenderer
            className="px-6 pb-4 flex-1"
            note={note}
            onNoteUpdate={onNoteUpdate}
            textColor={textColor}
            bgColor={bgColor}
            disableSyntaxHighlighting={disableSyntaxHighlighting}
          />
        )}
      </div>
      {!isEditMode && (
        <NoteFooter
          note={note}
          onPinToggle={async () => {
            await onPinToggle?.();
          }}
          onNoteDelete={onNoteDelete}
          constrainWidth={false}
          onClose={onClose}
          isMaximized={isMaximized}
          labels={labels}
          onRefetch={onRefetch}
        />
      )}
      <ScrollButtons scrollContainerRef={scrollContainerRef} />
      <AISidebar
        note={note}
        isOpen={isAISidebarOpen}
        onClose={() => setIsAISidebarOpen(false)}
        onNoteUpdate={onNoteUpdate}
        textColor={textColor}
        bgColor={bgColor}
      />
      <HistorySidebar
        note={note}
        isOpen={isHistorySidebarOpen}
        onClose={() => setIsHistorySidebarOpen(false)}
        onNoteUpdate={updatedNote => {
          setIsHistorySidebarOpen(false);
          onNoteUpdate?.(updatedNote);
        }}
        textColor={textColor}
        bgColor={bgColor}
      />
    </div>
  );
};

export default NoteDetails;
