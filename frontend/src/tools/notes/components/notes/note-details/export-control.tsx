import { Download } from "lucide-react";
import Button from "@notes/ui/button";
import Dropdown from "@notes/ui/dropdown";
import { apiClient } from "@notes/utils/api";
import { useState } from "react";
import type { Note } from "@notes/types/note-types";
import { useIsMobile } from "@notes/hooks/use-is-mobile";

interface ExportControlProps {
  note: Note;
}

const ExportControl = ({ note }: ExportControlProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const isMobile = useIsMobile();

  const handleExport = async (format: "txt" | "md" | "pdf") => {
    console.log("handleExport called with format:", format);
    if (isExporting) return;

    setIsExporting(true);
    try {
      console.log("Calling apiClient.downloadNote with:", note.id, format);
      await apiClient.notes.downloadNote(note.id, format);
      console.log("Download completed successfully");
    } catch (error) {
      console.error("Failed to download note:", error);
      // You could add a toast notification here
    } finally {
      setIsExporting(false);
    }
  };

  // Determine available formats based on content type
  const formats =
    note.content_type === "markdown"
      ? [
          { id: "pdf", label: "PDF" },
          { id: "md", label: "Markdown" },
        ]
      : [
          { id: "pdf", label: "PDF" },
          { id: "txt", label: "Text" },
        ];

  const dropdownItems = formats.map(({ id, label }) => ({
    id,
    node: (
      <div className="flex items-center gap-2 py-1">
        <Download size={16} />
        <span>Export as {label}</span>
      </div>
    ),
  }));

  return (
    <Dropdown
      trigger={
        <Button
          variant="plain"
          icon={Download}
          className="p-1"
          iconSize={isMobile ? "4" : "5"}
          title="Export note"
          disabled={isExporting}
        />
      }
      items={dropdownItems}
      onSelect={id => {
        console.log("onSelect called with id:", id);
        if (id) {
          handleExport(id as "txt" | "md" | "pdf");
        }
      }}
      horizontalContentAlignment="right"
    />
  );
};

export default ExportControl;
