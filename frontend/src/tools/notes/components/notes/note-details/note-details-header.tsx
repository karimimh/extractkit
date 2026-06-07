import { useSubscription } from "@notes/context/SubscriptionContext";
import { useTheme } from "@notes/context/ThemeContext";
import { useIsMobile } from "@notes/hooks/use-is-mobile";
import type { Note } from "@notes/types/note-types";
import Button from "@notes/ui/button";
import { getNoteColorStyles } from "@notes/utils/note-colors";
import { getTextDirection } from "@notes/utils/text-direction";
import { CircleX, History, Maximize, Minimize, Pencil, Save, Sparkles, X } from "lucide-react";
import NoteSettings from "./note-settings";

interface NoteDetailsHeaderProps {
  note: Note;
  onNoteUpdate?: (updatedNote: Note) => void;
  onNoteDelete?: (noteId: number) => void;
  isEditMode: boolean;
  setIsEditMode: React.Dispatch<React.SetStateAction<boolean>>;
  onDialogClose: () => void;
  isMaximized?: boolean;
  handleMaximizeClick?: () => void;
  hideMaximizeButton?: boolean;
  editTitle?: string;
  onEditTitleChange?: (title: string) => void;
  onToggleSidebar: () => void;
  onToggleHistory: () => void;
  onSave?: () => void;
  onCancel?: () => void;
}

const NoteDetailsHeader = ({
  note,
  onNoteUpdate,
  onNoteDelete,
  isEditMode,
  setIsEditMode,
  onDialogClose,
  isMaximized = false,
  handleMaximizeClick,
  hideMaximizeButton = false,
  editTitle,
  onEditTitleChange,
  onToggleSidebar,
  onToggleHistory,
  onSave,
  onCancel,
}: NoteDetailsHeaderProps) => {
  const { theme } = useTheme();
  const { subscription } = useSubscription();
  const isDarkMode = theme === "dark";
  const colorStyles = getNoteColorStyles(note, isDarkMode);
  const titleDirection = note.title ? getTextDirection(note.title) : "ltr";
  const titleAlign = titleDirection === "rtl" ? "right" : "left";
  const isPro = subscription?.is_pro ?? false;
  const isMobile = useIsMobile();

  return (
    <>
      <div
        className="absolute top-0 left-0 right-0 z-20 h-15 flex items-center justify-between shadow px-2"
        style={colorStyles}
      >
        <div className="flex-1 min-w-48 sm:min-w-80">
          {isEditMode ? (
            <input
              type="text"
              value={editTitle || ""}
              onChange={e => onEditTitleChange?.(e.target.value)}
              placeholder="Title"
              dir={titleDirection}
              style={{ textAlign: titleAlign }}
              className="w-full text-xl px-2 font-bold bg-transparent border-none focus:outline-none"
              autoFocus
            />
          ) : (
            <h2
              className="text-xl px-2 font-bold truncate break-words cursor-text"
              dir={titleDirection}
              style={{ textAlign: titleAlign }}
              onDoubleClick={e => {
                e.stopPropagation();
                setIsEditMode(true);
              }}
            >
              {note.title}
            </h2>
          )}
        </div>
        <div className="flex flex-row-reverse items-center justify-end gap-1 sm:gap-2 sm:pl-4">
          <Button
            variant="plain"
            icon={X}
            className="p-1"
            iconSize={isMobile ? "4" : "5"}
            onClick={onDialogClose}
            title="Close"
          />
          {!hideMaximizeButton && (
            <Button
              variant="plain"
              icon={isMaximized ? Minimize : Maximize}
              className="p-1 ml-1"
              iconSize={isMobile ? "4" : "5"}
              onClick={handleMaximizeClick}
              title="Maximize"
            />
          )}
          {isEditMode ? (
            <>
              {/* vertical separator */}
              <div className="h-6 border-l ml-1" />
              <Button
                variant="plain"
                icon={Save}
                className="p-1"
                iconSize={isMobile ? "4" : "5"}
                iconClassName="text-teal-700"
                onClick={onSave}
                title="Save"
              />
              <Button
                variant="plain"
                icon={CircleX}
                className="p-1"
                iconSize={isMobile ? "4" : "5"}
                iconClassName="text-red-600"
                onClick={onCancel}
                title="Cancel"
              />
            </>
          ) : (
            <>
              {/* vertical separator */}
              <div className="h-6 border-l ml-1" />
              <NoteSettings note={note} onNoteUpdate={onNoteUpdate} onNoteDelete={onNoteDelete} />
              <Button
                variant="plain"
                icon={History}
                className="p-1"
                iconSize={isMobile ? "4" : "5"}
                onClick={onToggleHistory}
                title="Version history"
              />
              <Button
                variant="plain"
                icon={Pencil}
                className="p-1"
                iconSize={isMobile ? "4" : "5"}
                onClick={() => setIsEditMode(true)}
                title="Edit"
              />
              {isPro && (
                <Button
                  variant="plain"
                  icon={Sparkles}
                  className="p-1"
                  onClick={onToggleSidebar}
                  iconSize={isMobile ? "4" : "5"}
                  title="AI Assistant"
                  style={colorStyles}
                />
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default NoteDetailsHeader;
