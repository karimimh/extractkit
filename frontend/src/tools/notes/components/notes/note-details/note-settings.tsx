import { LabelSelector } from "@notes/components/labels";
import type { Note } from "@notes/types/note-types";
import Button from "@notes/ui/button";
import ConfirmationDialog from "@notes/ui/confirmation-dialog";
import Popover from "@notes/ui/popover";
import ToggleButtons from "@notes/ui/toggle-buttons";
import { apiClient, type UpdateNoteData } from "@notes/utils/api";
import { formatNoteDateTime } from "@notes/utils/date-utils";
import { Settings, Trash, Download } from "lucide-react";
import React, { useState } from "react";
import ColorControls from "./note-color-controls";
import { useIsMobile } from "@notes/hooks/use-is-mobile";

interface NoteSettingsProps {
  note: Note;
  onNoteUpdate?: (updatedNote: Note) => void;
  onNoteDelete?: (noteId: number) => void;
}

const NoteSettings: React.FC<NoteSettingsProps> = ({ note, onNoteUpdate, onNoteDelete }) => {
  const [textColor, setTextColor] = useState(note.color || "");
  const [bgColor, setBgColor] = useState(note.bg_color || "");
  const [selectedLabelIds, setSelectedLabelIds] = useState<number[]>(
    note.labels?.map(label => label.id) || []
  );
  const [contentType, setContentType] = useState<"text" | "markdown">(note.content_type);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleUpdate = async (updates: UpdateNoteData) => {
    try {
      const updatedNote = await apiClient.notes.updateNote(note.id, updates);
      onNoteUpdate?.(updatedNote);
    } catch (error) {
      console.error("Failed to update note:", error);
    }
  };

  const handleColorChange = (textColor: string, bgColor: string) => {
    setTextColor(textColor);
    setBgColor(bgColor);
    handleUpdate({ color: textColor || undefined, bg_color: bgColor || undefined });
  };

  const handleLabelsChange = (labelIds: number[]) => {
    setSelectedLabelIds(labelIds);
    handleUpdate({ labels: labelIds });
  };

  const handleContentTypeChange = (type: "text" | "markdown") => {
    setContentType(type);
    handleUpdate({ content_type: type });
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    apiClient.notes.deleteNote(note.id).then(() => {
      onNoteDelete?.(note.id);
      setShowDeleteConfirm(false);
    });
  };

  const handleExport = async (format: "txt" | "md" | "pdf") => {
    if (isExporting) return;

    setIsExporting(true);
    try {
      await apiClient.notes.downloadNote(note.id, format);
    } catch (error) {
      console.error("Failed to download note:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const isMobile = useIsMobile();
  return (
    <>
      <Popover horizontalContentAlignment="right" mobileVariant="drawer">
        <Popover.Trigger
          className="p-1"
          variant="plain"
          icon={Settings}
          iconSize={isMobile ? "4" : "5"}
          title="Note Info"
        />
        <Popover.Content className="p-3 sm:p-6 min-w-96 border border-[var(--border-primary)] rounded-lg">
          <div className="flex flex-col items-start gap-4 text-sm w-full">
            {/* Note Controls */}
            <ColorControls
              textColor={textColor}
              bgColor={bgColor}
              onColorChange={handleColorChange}
            />
            {/* Divider */}
            <div className="w-full border-t border-gray-200" />
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Labels</h3>
              <LabelSelector
                selectedLabelIds={selectedLabelIds}
                onLabelsChange={handleLabelsChange}
              />
            </div>
            {/* Divider */}
            <div className="w-full border-t border-gray-200" />
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Content Type</h3>
              <ToggleButtons
                label=""
                options={[
                  { value: "text", label: ".txt" },
                  { value: "markdown", label: ".md" },
                ]}
                value={contentType}
                onChange={value => handleContentTypeChange(value as "text" | "markdown")}
              />
            </div>

            {/* Divider */}
            <div className="w-full border-t border-gray-200" />

            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="font-medium text-gray-700">Created:</span>
                <span className="text-gray-600">{formatNoteDateTime(note.created_at)}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-medium text-gray-700">Last Updated:</span>
                <span className="text-gray-600">{formatNoteDateTime(note.updated_at)}</span>
              </div>
              {note.images.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-700">Images:</span>
                  <span className="text-gray-600">{note.images.length} attached</span>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="w-full border-t border-gray-200" />

            {/* Export Buttons */}
            <div className="w-full">
              <h3 className="font-medium text-gray-700 mb-2">Export</h3>
              <div className="flex flex-col gap-2">
                <Button
                  variant="secondary"
                  icon={Download}
                  className="w-full"
                  onClick={() => handleExport("pdf")}
                  disabled={isExporting}
                >
                  Export as PDF
                </Button>
                {note.content_type === "markdown" ? (
                  <Button
                    variant="secondary"
                    icon={Download}
                    className="w-full"
                    onClick={() => handleExport("md")}
                    disabled={isExporting}
                  >
                    Export as Markdown
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    icon={Download}
                    className="w-full"
                    onClick={() => handleExport("txt")}
                    disabled={isExporting}
                  >
                    Export as Text
                  </Button>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="w-full border-t border-gray-200" />

            {/* Delete Button */}
            <div className="w-full">
              <Button
                variant="secondary"
                icon={Trash}
                className="w-full text-red-600 border-red-300 hover:bg-red-50"
                onClick={handleDeleteClick}
              >
                Delete Note
              </Button>
            </div>
          </div>
        </Popover.Content>
      </Popover>
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Note"
        message="Are you sure you want to delete this note? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        variant="danger"
      />
    </>
  );
};

export default NoteSettings;
