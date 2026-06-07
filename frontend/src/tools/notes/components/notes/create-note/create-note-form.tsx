import { useIsMobile } from "@notes/hooks/use-is-mobile";
import Dialog from "@notes/ui/dialog/dialog";
import { apiClient, type CreateNoteData } from "@notes/utils/api";
import { cn } from "@notes/utils/css-utils";
import { getTextDirection } from "@notes/utils/text-direction";
import { PenBoxIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import NoteFormContent from "./note-form-content";
import NoteFormSettings from "./note-form-settings";

interface CreateNoteFormProps {
  onNoteCreated?: () => void;
}

const CreateNoteForm = ({ onNoteCreated }: CreateNoteFormProps) => {
  const isMobile = useIsMobile();
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [createdNoteId, setCreatedNoteId] = useState<number | undefined>(undefined);
  const [formData, setFormData] = useState<CreateNoteData>({
    title: "",
    content: "",
    content_type: "markdown",
    labels: [],
    color: "#000000",
    bg_color: "#ffffff",
  });

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);

  // Auto-save function with debouncing
  const autoSaveNote = useCallback(async () => {
    if (isSavingRef.current) return;

    // Don't save if both title and content are empty
    if (!(formData.title ?? "").trim() && !formData.content.trim()) {
      // If a note was already created, delete it
      if (createdNoteId) {
        try {
          await apiClient.notes.deleteNote(createdNoteId);
          setCreatedNoteId(undefined);
        } catch (err) {
          console.error("Failed to delete empty note:", err);
        }
      }
      return;
    }

    try {
      isSavingRef.current = true;

      if (createdNoteId) {
        // Update existing note
        interface UpdateNotePayload {
          content: string;
          content_type: "text" | "markdown";
          color: string;
          bg_color: string;
          title?: string;
          labels?: number[];
        }

        const updateData: UpdateNotePayload = {
          content: formData.content,
          content_type: formData.content_type,
          color: formData.color,
          bg_color: formData.bg_color,
        };

        if (formData.title?.trim()) {
          updateData.title = formData.title.trim();
        }

        if (formData.labels && formData.labels.length > 0) {
          updateData.labels = formData.labels;
        }

        await apiClient.notes.updateNote(createdNoteId, updateData);
      } else {
        // Create new note
        const noteData: CreateNoteData = {
          content: formData.content,
          content_type: formData.content_type,
          color: formData.color,
          bg_color: formData.bg_color,
        };

        if (formData.title?.trim()) {
          noteData.title = formData.title.trim();
        }

        if (formData.labels && formData.labels.length > 0) {
          noteData.labels = formData.labels;
        }

        const createdNote = await apiClient.notes.createNote(noteData);
        setCreatedNoteId(createdNote.id);
      }

      setError(null);
    } catch (err) {
      console.error("Failed to auto-save note:", err);
      setError(err instanceof Error ? err.message : "Failed to save note");
    } finally {
      isSavingRef.current = false;
    }
  }, [createdNoteId, formData]);

  // Create note if it doesn't exist (used for image uploads)
  const createNoteIfNeeded = useCallback(async (): Promise<number | undefined> => {
    if (createdNoteId) {
      return createdNoteId;
    }

    try {
      isSavingRef.current = true;

      const noteData: CreateNoteData = {
        content: formData.content || " ",
        content_type: formData.content_type,
        color: formData.color,
        bg_color: formData.bg_color,
      };

      if (formData.title?.trim()) {
        noteData.title = formData.title.trim();
      }

      if (formData.labels && formData.labels.length > 0) {
        noteData.labels = formData.labels;
      }

      const createdNote = await apiClient.notes.createNote(noteData);
      setCreatedNoteId(createdNote.id);
      setError(null);
      return createdNote.id;
    } catch (err) {
      console.error("Failed to create note:", err);
      setError(err instanceof Error ? err.message : "Failed to create note");
      return undefined;
    } finally {
      isSavingRef.current = false;
    }
  }, [createdNoteId, formData]);

  // Debounced auto-save when title or content changes
  useEffect(() => {
    if (!isOpen) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for auto-save
    saveTimeoutRef.current = setTimeout(() => {
      void autoSaveNote();
    }, 1000); // 1 second debounce

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [isOpen, formData.title, formData.content, autoSaveNote]);

  const handleDialogClose = async () => {
    // Clear any pending save timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Check if there's any content before saving
    const hasContent = formData.title?.trim() || formData.content.trim();

    // Try to save - autoSaveNote will handle empty notes by deleting them
    await autoSaveNote();

    // Trigger refetch if there was any content
    if (hasContent) {
      onNoteCreated?.();
    }

    // Reset form
    setFormData({
      title: "",
      content: "",
      content_type: "markdown",
      labels: [],
      color: "#000000",
      bg_color: "#ffffff",
    });
    setError(null);
    setCreatedNoteId(undefined);
    setIsOpen(false);
  };

  const titleDirection = formData.title ? getTextDirection(formData.title) : "ltr";
  const titleAlign = titleDirection === "rtl" ? "right" : "left";

  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={open => {
        if (!open) {
          void handleDialogClose();
        } else {
          setIsOpen(true);
        }
      }}
      mobileVariant="fullscreen"
    >
      <Dialog.Trigger
        className={cn(
          isMobile
            ? "fixed bottom-6 left-6 z-50 size-14 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-all hover:shadow-xl flex items-center justify-center"
            : "w-full cursor-text border border-[var(--border-primary)] rounded-xl px-3 py-2 text-[var(--text-tertiary)] bg-[var(--bg-primary)] hover:border-[var(--border-secondary)] transition-colors flex items-center gap-2"
        )}
        variant="plain"
      >
        {isMobile ? (
          <PenBoxIcon className="size-6" />
        ) : (
          <div className="text-blue-600 transition-all flex items-center justify-center size-7 rounded-lg">
            <PenBoxIcon className="size-5" />
          </div>
        )}
        {!isMobile && <span className="text-sm">Take a note...</span>}
      </Dialog.Trigger>
      <Dialog.Content allowFullscreen className="relative">
        <Dialog.Content.Header className="shadow-sm flex items-center justify-between">
          <input
            id="note-title"
            value={formData.title || ""}
            onChange={e => setFormData(prev => ({ ...prev, title: e.target.value || undefined }))}
            placeholder="Title"
            dir={titleDirection}
            style={{ textAlign: titleAlign }}
            className="flex-1 text-2xl font-semibold bg-transparent border-none focus:outline-none text-[var(--text-primary)]"
          />
        </Dialog.Content.Header>
        <Dialog.Content.ExtraControls>
          <NoteFormSettings
            formData={formData}
            onFormDataChange={updates => setFormData(prev => ({ ...prev, ...updates }))}
          />
        </Dialog.Content.ExtraControls>
        <div
          className={cn(
            "flex flex-col p-6 pt-3",
            isMobile ? "h-[calc(100%-2.5rem)]" : "h-[calc(100%-4rem)]"
          )}
        >
          <NoteFormContent
            formData={formData}
            onFormDataChange={content => setFormData(prev => ({ ...prev, content }))}
            onContentTypeChange={type => setFormData(prev => ({ ...prev, content_type: type }))}
            error={error}
            noteId={createdNoteId}
            mode="create"
            autoFocus={isOpen}
            onCreateNote={createNoteIfNeeded}
          />
        </div>
      </Dialog.Content>
    </Dialog>
  );
};

CreateNoteForm.displayName = "CreateNoteForm";

export default CreateNoteForm;
