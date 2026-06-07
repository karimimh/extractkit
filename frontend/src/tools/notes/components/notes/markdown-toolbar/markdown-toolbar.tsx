import { useIsMobile } from "@notes/hooks/use-is-mobile";
import { apiClient } from "@notes/utils/api";
import { getAbsoluteImageUrl } from "@notes/utils/image-url-utils";
import {
  Bold,
  Code,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Image,
  ImagePlus,
  Italic,
  Link,
  List,
  ListOrdered,
  ListTodo,
  Minus,
  Paintbrush,
  Quote,
  Table,
  Underline,
} from "lucide-react";
import { useRef, useState } from "react";
import DrawingModal from "./drawing-modal";

interface MarkdownToolbarProps {
  textareaId: string;
  content: string;
  onContentChange: (content: string) => void;
  noteId?: number;
  onCreateNote?: () => Promise<number | undefined>;
}

interface ToolItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  action: () => void;
  disabled?: boolean;
}

const MarkdownToolbar: React.FC<MarkdownToolbarProps> = ({
  textareaId,
  content,
  onContentChange,
  noteId,
  onCreateNote,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDrawingModalOpen, setIsDrawingModalOpen] = useState(false);
  const getTextarea = () => document.getElementById(textareaId) as HTMLTextAreaElement;

  const insertText = (before: string, after: string = "", placeholder: string = "") => {
    const textarea = getTextarea();
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const textToInsert = selectedText || placeholder;

    const newText =
      content.substring(0, start) + before + textToInsert + after + content.substring(end);

    onContentChange(newText);

    // Set cursor position after insertion
    setTimeout(() => {
      const newCursorPos = start + before.length + textToInsert.length;
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const insertAtLineStart = (prefix: string) => {
    const textarea = getTextarea();
    if (!textarea) return;

    const start = textarea.selectionStart;

    // Find the start of the current line
    const lineStart = content.lastIndexOf("\n", start - 1) + 1;

    const newText = content.substring(0, lineStart) + prefix + content.substring(lineStart);

    onContentChange(newText);

    // Set cursor position after the prefix
    setTimeout(() => {
      const newCursorPos = start + prefix.length;
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const insertTable = () => {
    const tableMarkdown = `
| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
`;
    const textarea = getTextarea();
    if (!textarea) return;

    const start = textarea.selectionStart;
    const newText = content.substring(0, start) + tableMarkdown + content.substring(start);

    onContentChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 11, start + 20); // Select "Header 1"
    }, 0);
  };

  const insertCodeBlock = () => {
    const codeBlock = "\n```\nYour code here\n```\n";
    const textarea = getTextarea();
    if (!textarea) return;

    const start = textarea.selectionStart;
    const newText = content.substring(0, start) + codeBlock + content.substring(start);

    onContentChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 5, start + 18); // Select "Your code here"
    }, 0);
  };

  const insertImage = () => {
    const imageMarkdown = "![alt text](image-url)";
    const textarea = getTextarea();
    if (!textarea) return;

    const start = textarea.selectionStart;
    const newText = content.substring(0, start) + imageMarkdown + content.substring(start);

    onContentChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 2, start + 10); // Select "alt text"
    }, 0);
  };

  const insertLink = () => {
    const textarea = getTextarea();
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);

    const linkMarkdown = selectedText ? `[${selectedText}](url)` : "[label](url)";

    const newText = content.substring(0, start) + linkMarkdown + content.substring(end);

    onContentChange(newText);

    setTimeout(() => {
      textarea.focus();
      if (selectedText) {
        // If text was selected, select "url"
        const urlStart = start + selectedText.length + 3;
        textarea.setSelectionRange(urlStart, urlStart + 3);
      } else {
        // Otherwise select "label"
        textarea.setSelectionRange(start + 1, start + 6);
      }
    }, 0);
  };

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    await uploadImageFile(file);

    // Clear the input
    event.target.value = "";
  };

  const handleDrawingSave = async (imageBlob: Blob) => {
    const file = new File([imageBlob], `drawing-${Date.now()}.png`, { type: "image/png" });
    await uploadImageFile(file);
  };

  const uploadImageFile = async (file: File) => {
    const textarea = getTextarea();
    if (!textarea) return;

    // If note doesn't exist yet, create it first
    let currentNoteId = noteId;
    if (!currentNoteId && onCreateNote) {
      currentNoteId = await onCreateNote();
      if (!currentNoteId) return;
    }

    if (!currentNoteId) return;

    try {
      // Upload to note
      const uploadResult = await apiClient.images.uploadImage(currentNoteId, {
        image: file,
        alt_text: file.name,
      });
      // get note url
      const absoluteImageUrl = getAbsoluteImageUrl(uploadResult.image);
      const imageMarkdown = `![${file.name}](${absoluteImageUrl})`;

      const start = textarea.selectionStart;

      // Determine if we need to add spacing
      let prefix = "";
      let suffix = "";

      // Check if content is empty
      if (content.trim() === "") {
        // For empty content, just insert the image
        prefix = "";
        suffix = "";
      } else {
        // Check if cursor is at beginning of line or if there's text before cursor
        const textBefore = content.substring(0, start);
        const lastChar = textBefore[textBefore.length - 1];

        // Add newline before if we're not at the start and the previous char is not already a newline
        if (start > 0 && lastChar !== "\n") {
          prefix = "\n";
        }

        // Check if there's text after cursor
        const textAfter = content.substring(start);
        const nextChar = textAfter[0];

        // Add newline after if there's content after and it's not already a newline
        if (textAfter.length > 0 && nextChar !== "\n") {
          suffix = "\n";
        }
      }

      const newText =
        content.substring(0, start) + prefix + imageMarkdown + suffix + content.substring(start);

      onContentChange(newText);

      setTimeout(() => {
        textarea.focus();
        const newCursorPos = start + prefix.length + imageMarkdown.length + suffix.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    } catch (error) {
      console.error("Failed to upload image:", error);
    }
  };

  const tools: ToolItem[] = [
    {
      icon: Heading1,
      label: "Heading 1",
      action: () => insertAtLineStart("# "),
    },
    {
      icon: Heading2,
      label: "Heading 2",
      action: () => insertAtLineStart("## "),
    },
    {
      icon: Heading3,
      label: "Heading 3",
      action: () => insertAtLineStart("### "),
    },
    {
      icon: Bold,
      label: "Bold",
      action: () => insertText("**", "**", "bold text"),
    },
    {
      icon: Italic,
      label: "Italic",
      action: () => insertText("*", "*", "italic text"),
    },
    {
      icon: Underline,
      label: "Underline",
      action: () => insertText("<u>", "</u>", "underlined text"),
    },
    {
      icon: Link,
      label: "Link",
      action: insertLink,
    },
    {
      icon: Quote,
      label: "Blockquote",
      action: () => insertAtLineStart("> "),
    },
    {
      icon: Minus,
      label: "Horizontal Rule",
      action: () => insertText("\n---\n"),
    },
    {
      icon: Code,
      label: "Inline Code",
      action: () => insertText("`", "`", "code"),
    },
    {
      icon: Code2,
      label: "Code Block",
      action: insertCodeBlock,
    },
    {
      icon: List,
      label: "Unordered List",
      action: () => insertAtLineStart("- "),
    },
    {
      icon: ListOrdered,
      label: "Ordered List",
      action: () => insertAtLineStart("1. "),
    },
    {
      icon: ListTodo,
      label: "Checklist",
      action: () => insertAtLineStart("- [ ] "),
    },
    {
      icon: Table,
      label: "Table",
      action: insertTable,
    },
    {
      icon: Image,
      label: "Image",
      action: insertImage,
    },
    {
      icon: ImagePlus,
      label: "Upload Image",
      action: handleImageUpload,
    },
    {
      icon: Paintbrush,
      label: "Draw",
      action: () => setIsDrawingModalOpen(true),
    },
  ];

  const isMobile = useIsMobile();

  return (
    <div className="overflow-scroll sm:overflow-[unset] flex sm:flex-wrap gap-1 p-2 border border-[var(--border-primary)] rounded-l-full rounded-r-full">
      {tools.map((tool, index) => {
        const Icon = tool.icon;
        const isDisabled = tool.disabled || false;
        return (
          <button
            key={index}
            type="button"
            onClick={tool.action}
            disabled={isDisabled}
            className={`p-2 rounded transition-colors ${
              isDisabled
                ? "text-[var(--text-tertiary)] cursor-not-allowed"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] cursor-pointer"
            }`}
            title={tool.label}
          >
            <Icon className={isMobile ? "size-4" : "size-5"} />
          </button>
        );
      })}

      {/* Hidden file input for image uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Drawing modal */}
      <DrawingModal
        isOpen={isDrawingModalOpen}
        onClose={() => setIsDrawingModalOpen(false)}
        onSave={handleDrawingSave}
      />
    </div>
  );
};

export default MarkdownToolbar;
