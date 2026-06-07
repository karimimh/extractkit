import type { Note } from "@notes/types/note-types";
import MarkdownRenderer from "@notes/ui/markdown-renderer";
import { cn } from "@notes/utils/css-utils";
import { getTextDirection } from "@notes/utils/text-direction";

interface NoteRendererProps {
  note: Note;
  className?: string;
  isPreview?: boolean;
  onNoteUpdate?: (updatedNote: Note) => void;
  disableSyntaxHighlighting?: boolean;
  bgColor?: string;
  textColor?: string;
}

const NoteRenderer: React.FC<NoteRendererProps> = ({
  note,
  className,
  isPreview = false,
  onNoteUpdate,
  bgColor,
  textColor,
  disableSyntaxHighlighting = false,
}) => {
  const direction = getTextDirection(note.content);
  const handleCheckboxToggle = async (lineIndex: number) => {
    if (!onNoteUpdate) return;

    const lines = note.content.split("\n");
    const line = lines[lineIndex];

    // Toggle the checkbox state
    const updatedLine = line.includes("[x]")
      ? line.replace("[x]", "[ ]")
      : line.replace("[ ]", "[x]");

    lines[lineIndex] = updatedLine;
    const updatedContent = lines.join("\n");

    // Import apiClient dynamically to avoid circular dependencies
    const { apiClient } = await import("@notes/utils/api");
    try {
      const updatedNote = await apiClient.notes.updateNote(note.id, { content: updatedContent });
      onNoteUpdate(updatedNote);
    } catch (error) {
      console.error("Failed to update checkbox:", error);
    }
  };

  return note.content_type === "markdown" ? (
    <MarkdownRenderer
      content={note.content}
      bgColor={bgColor ?? note.bg_color}
      textColor={textColor ?? note.color}
      className={className}
      isPreview={isPreview}
      onCheckboxToggle={handleCheckboxToggle}
      disableSyntaxHighlighting={disableSyntaxHighlighting}
    />
  ) : (
    <div
      className={cn(
        isPreview
          ? "whitespace-pre-wrap break-all text-sm"
          : "whitespace-pre-wrap break-all flex-1",
        className
      )}
      dir={direction}
    >
      {note.content}
    </div>
  );
};

export default NoteRenderer;
