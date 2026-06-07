import { useTheme } from "@notes/context/ThemeContext";
import { useIsMobile } from "@notes/hooks/use-is-mobile";
import AutogrowingTextarea, {
  type AutogrowingTextareaHandle,
} from "@notes/ui/input/auto-growing-text-area";
import CopyButton from "@notes/ui/copy-button";
import { type CreateNoteData } from "@notes/utils/api";
import { cn } from "@notes/utils/css-utils";
import { getNoteColorStyles } from "@notes/utils/note-colors";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import MarkdownToolbar from "../markdown-toolbar/markdown-toolbar";
import NoteRenderer from "../note-renderer";
import { getTextDirection } from "@notes/utils/text-direction";

interface NoteFormContentProps {
  formData: CreateNoteData;
  onFormDataChange: (content: string) => void;
  onContentTypeChange: (type: "text" | "markdown") => void;
  error: string | null;
  noteId?: number;
  mode?: "create" | "edit";
  autoFocus?: boolean;
  onCreateNote?: () => Promise<number | undefined>;
}

const NoteFormContent: React.FC<NoteFormContentProps> = ({
  formData,
  onFormDataChange,
  onContentTypeChange: _onContentTypeChange,
  error,
  noteId,
  mode = "create",
  autoFocus = false,
  onCreateNote,
}) => {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";
  const isMobile = useIsMobile();

  // Initialize showPreview based on mode and device
  const [showPreview, setShowPreview] = useState(() => {
    // Only enable preview on non-mobile devices in edit mode
    return !isMobile && mode === "edit";
  });

  // Track if user has started typing (for create mode)
  const [hasStartedTyping, setHasStartedTyping] = useState(false);

  const contentDirection = getTextDirection(formData.content);
  const contentAlign = contentDirection === "rtl" ? "right" : "left";
  const previewRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<AutogrowingTextareaHandle>(null);

  // Enable preview when user starts typing in create mode on non-mobile devices
  useEffect(() => {
    if (mode === "create" && !isMobile && formData.content.trim() && !hasStartedTyping) {
      setHasStartedTyping(true);
      setShowPreview(true);
    }
  }, [formData.content, mode, isMobile, hasStartedTyping]);

  // Focus textarea when autoFocus is true
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleTextareaScroll = useCallback(
    (event: React.UIEvent<HTMLTextAreaElement>) => {
      if (!previewRef.current) return;

      const textarea = event.currentTarget;
      const scrollPercentage = textarea.scrollTop / (textarea.scrollHeight - textarea.clientHeight);

      // Get the line number at the current scroll position
      const textBeforeScroll = formData.content.substring(
        0,
        Math.floor(scrollPercentage * formData.content.length)
      );
      const currentLine = textBeforeScroll.split("\n").length - 1;

      // Find the element with the closest line-start attribute
      const previewElements = previewRef.current.querySelectorAll("[data-line-start]");
      let targetElement: Element | null = null;

      for (const element of previewElements) {
        const lineStart = parseInt(element.getAttribute("data-line-start") || "0", 10);
        if (lineStart <= currentLine) {
          targetElement = element;
        } else {
          break;
        }
      }

      if (targetElement) {
        // Scroll the preview to the target element
        targetElement.scrollIntoView({ block: "start", behavior: "auto" });
      }
    },
    [formData.content]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && formData.content_type === "markdown") {
      const textarea = e.currentTarget;
      const cursorPos = textarea.selectionStart;
      const textBeforeCursor = formData.content.substring(0, cursorPos);
      const lines = textBeforeCursor.split("\n");
      const currentLine = lines[lines.length - 1];

      // Check for checklist
      const checklistMatch = currentLine.match(/^(\s*)-\s+\[([x ])\]\s+/);
      if (checklistMatch) {
        e.preventDefault();
        const indent = checklistMatch[1];
        const newContent =
          formData.content.substring(0, cursorPos) +
          "\n" +
          indent +
          "- [ ] " +
          formData.content.substring(cursorPos);
        onFormDataChange(newContent);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = cursorPos + indent.length + 7;
        }, 0);
        return;
      }

      // Check for unordered list
      const unorderedMatch = currentLine.match(/^(\s*)-\s+/);
      if (unorderedMatch) {
        e.preventDefault();
        const indent = unorderedMatch[1];
        const newContent =
          formData.content.substring(0, cursorPos) +
          "\n" +
          indent +
          "- " +
          formData.content.substring(cursorPos);
        onFormDataChange(newContent);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = cursorPos + indent.length + 3;
        }, 0);
        return;
      }

      // Check for ordered list
      const orderedMatch = currentLine.match(/^(\s*)(\d+)\.\s+/);
      if (orderedMatch) {
        e.preventDefault();
        const indent = orderedMatch[1];
        const nextNum = parseInt(orderedMatch[2]) + 1;
        const newContent =
          formData.content.substring(0, cursorPos) +
          "\n" +
          indent +
          nextNum +
          ". " +
          formData.content.substring(cursorPos);
        onFormDataChange(newContent);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd =
            cursorPos + indent.length + nextNum.toString().length + 3;
        }, 0);
        return;
      }
    }
  };

  // Create a mock note object for preview styling
  const previewNote = {
    id: 0,
    content: formData.content,
    content_type: formData.content_type,
    is_pinned: false,
    order: 0,
    pin_order: 0,
    color: formData.color,
    bg_color: formData.bg_color,
    created_at: "",
    updated_at: "",
    images: [],
    title: formData.title,
  };

  const colorStyles = getNoteColorStyles(previewNote, isDarkMode);

  return (
    <div className="flex-1 flex flex-col overflow-hidden px-1 gap-2">
      {/* Markdown Toolbar - only show for markdown content type */}
      {formData.content_type === "markdown" && (
        <MarkdownToolbar
          textareaId="note-content"
          content={formData.content}
          onContentChange={onFormDataChange}
          noteId={noteId}
          onCreateNote={onCreateNote}
        />
      )}

      {/* Content Section with Preview Toggle */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Edit Section - on mobile: hide when preview is shown, on desktop: always show */}
        {(!isMobile || !showPreview) && (
          <div
            className={`flex flex-col relative ${showPreview && !isMobile ? "flex-1" : "w-full"}`}
          >
            {/* Action buttons in Top Right of edit section */}
            <div className="absolute top-2 right-2 z-10 flex gap-1">
              {/* Copy Button */}
              <CopyButton text={formData.content} size={20} />

              {/* Preview toggle button - only show in markdown mode */}
              {formData.content_type === "markdown" && (
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  title={showPreview ? "Hide preview" : "Show preview"}
                >
                  {showPreview ? <EyeOffIcon className="size-5" /> : <EyeIcon className="size-5" />}
                </button>
              )}
            </div>
            <div className="flex-1 flex flex-col gap-4">
              {/* Content Textarea */}
              <div className="flex-1 flex flex-col">
                <AutogrowingTextarea
                  ref={textareaRef}
                  id="note-content"
                  value={formData.content}
                  onChange={onFormDataChange}
                  onKeyDown={handleKeyDown}
                  onScroll={handleTextareaScroll}
                  placeholder="Write your note content here..."
                  className={cn(
                    "flex-1 w-full py-2 px-3 resize-none focus:outline-none rounded-none border-l border-[var(--border-primary)]",
                    formData.content_type === "markdown" ? "" : ""
                  )}
                  minRows={3}
                  maxRows={10}
                  dir={contentDirection}
                  style={{ textAlign: contentAlign }}
                />
              </div>

              {/* Error display */}
              {error && <div className="text-red-600 text-sm">{error}</div>}
            </div>
          </div>
        )}

        {/* Preview Section - on mobile: show only when preview is enabled, on desktop: show when preview is enabled */}
        {showPreview && formData.content_type === "markdown" && (
          <div
            className={cn(
              "flex-1 flex flex-col p-2 border-r border-b border-t border-[var(--border-primary)] bg-[var(--bg-secondary)]",
              isMobile && "border-l"
            )}
          >
            <div className="flex-1 overflow-auto" style={colorStyles} ref={previewRef}>
              {/* Preview Content */}
              {formData.content.trim() ? (
                <NoteRenderer note={previewNote} />
              ) : (
                <div className="text-[var(--text-tertiary)] italic">
                  Start typing to see a preview...
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteFormContent;
