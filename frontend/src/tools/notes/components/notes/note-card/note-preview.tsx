"use client";

import type { Note } from "@notes/types/note-types";
import type { Label } from "@notes/types/label-types";
import NoteRenderer from "../note-renderer";
import NoteFooter from "./note-footer";
import { getNoteColorStyles, getDarkModeColor } from "@notes/utils/note-colors";
import { useTheme } from "@notes/context/ThemeContext";
import { getTextDirection } from "@notes/utils/text-direction";

interface NotePreviewProps {
  note: Note;
  onNoteDelete?: (noteId: number) => void;
  onPinToggle: () => Promise<void>;
  isNoteHovered?: boolean;
  labels: Label[];
  onRefetch?: (force?: boolean) => void;
}

const NotePreview = ({
  note,
  onPinToggle,
  onNoteDelete,
  isNoteHovered = false,
  labels,
  onRefetch,
}: NotePreviewProps) => {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";
  const bgColor = isDarkMode ? getDarkModeColor(note.color, note.bg_color, "bg") : note.bg_color;
  const textColor = isDarkMode ? getDarkModeColor(note.color, note.bg_color, "text") : note.color;
  const titleDirection = note.title ? getTextDirection(note.title) : "ltr";
  const titleAlign = titleDirection === "rtl" ? "right" : "left";

  return (
    <div className="flex flex-col h-full rounded-2xl overflow-hidden">
      {/* Content Area with Padding - Non-scrollable */}
      <div
        className="flex-1 flex flex-col px-5 pt-5 pb-3 cursor-pointer overflow-hidden min-h-0 relative"
        style={getNoteColorStyles(note, isDarkMode)}
      >
        {Boolean(note.title) && (
          <h3
            className="text-base font-semibold line-clamp-2 mb-3 leading-snug flex-shrink-0 tracking-[-0.01em]"
            dir={titleDirection}
            style={{ textAlign: titleAlign }}
          >
            {note.title}
          </h3>
        )}

        {/* Note Content */}
        <div className="flex-1 min-h-0 overflow-hidden relative">
          <NoteRenderer
            className="text-[13px] leading-[1.6]"
            note={note}
            isPreview={true}
            textColor={textColor}
            bgColor={bgColor}
            disableSyntaxHighlighting
          />
          {/* Fade effect at bottom */}
          <div
            className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
            style={{
              background: `linear-gradient(to top, ${bgColor}, transparent)`,
            }}
          />
        </div>
      </div>

      {/* Footer - Always visible at bottom */}
      <NoteFooter
        isNoteHovered={isNoteHovered}
        note={note}
        onPinToggle={onPinToggle}
        onNoteDelete={onNoteDelete}
        labels={labels}
        onRefetch={onRefetch}
      />
    </div>
  );
};

export default NotePreview;
