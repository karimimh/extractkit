import { useIsMobile } from "@notes/hooks/use-is-mobile";
import type { Note } from "@notes/types/note-types";
import { apiClient, type CreateNoteData } from "@notes/utils/api";
import { cn } from "@notes/utils/css-utils";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import NoteFormContent from "../create-note/note-form-content";

interface EditNoteFormProps {
  note: Note;
  onNoteUpdate?: (updatedNote: Note) => void;
  onCancel?: () => void;
  editTitle?: string;
  onEditTitleChange?: (title: string) => void;
}

export interface EditNoteFormRef {
  submit: () => void;
}

const EditNoteForm = forwardRef<EditNoteFormRef, EditNoteFormProps>(
  ({ note, onNoteUpdate, onCancel, editTitle }, ref) => {
    const isMobile = useIsMobile();

    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState<CreateNoteData>({
      title: "",
      content: "",
      content_type: "markdown",
      labels: [],
      color: "#000000",
      bg_color: "#ffffff",
    });

    useEffect(() => {
      setFormData({
        title: note.title || "",
        content: note.content,
        content_type: note.content_type,
        labels: note.labels?.map(l => l.id) || [],
        color: note.color,
        bg_color: note.bg_color,
      });
      setError(null);
    }, [note]);

    useImperativeHandle(ref, () => ({
      submit: () => handleSubmit({ preventDefault: () => {} } as React.FormEvent),
    }));

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      setError(null);

      try {
        const contentToSave = formData.content;

        const noteData: Partial<CreateNoteData> = {
          content: contentToSave,
          content_type: formData.content_type,
          title: (editTitle || "").trim() || "",
        };

        const updatedNote = await apiClient.notes.updateNote(note.id, noteData);
        onNoteUpdate?.(updatedNote);
        onCancel?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update note");
      }
    };

    return (
      <div
        className={cn(
          "flex flex-col p-6 flex-1",
          isMobile ? "h-[calc(100%-2.5rem)]" : "h-[calc(100%-7rem)]"
        )}
      >
        <NoteFormContent
          formData={formData}
          onFormDataChange={content => setFormData(prev => ({ ...prev, content }))}
          onContentTypeChange={type => setFormData(prev => ({ ...prev, content_type: type }))}
          error={error}
          noteId={note?.id}
          mode="edit"
        />
      </div>
    );
  }
);

EditNoteForm.displayName = "EditNoteForm";

export default EditNoteForm;
