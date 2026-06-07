"use client";

import { useIsMobile } from "@notes/hooks/use-is-mobile";
import type { Note } from "@notes/types/note-types";
import type { Label } from "@notes/types/label-types";
import Button from "@notes/ui/button";
import ConfirmationDialog from "@notes/ui/confirmation-dialog";
import HoverCard from "@notes/ui/hover-card";
import Menu, { type MenuItem } from "@notes/ui/menu";
import { apiClient } from "@notes/utils/api";
import { cn } from "@notes/utils/css-utils";
import { ChevronLeft, Download, MoreVertical, Pin, PinOff, Tag, Trash } from "lucide-react";
import { useState } from "react";
import LabelTag from "../../labels/label-tag";
import { useTheme } from "@notes/context/ThemeContext";

interface NoteFooterProps {
  note: Note;
  onPinToggle: () => Promise<void>;
  onNoteDelete?: (noteId: number) => void;
  constrainWidth?: boolean;
  isNoteHovered?: boolean;
  onClose?: () => void;
  isMaximized?: boolean;
  labels: Label[];
  onRefetch?: (force?: boolean) => void;
}

const NoteFooter = ({
  note,
  onPinToggle,
  onNoteDelete,
  constrainWidth = true,
  isNoteHovered = false,
  onClose,
  isMaximized = false,
  labels,
  onRefetch,
}: NoteFooterProps) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const isMobile = useIsMobile();
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await apiClient.notes.deleteNote(note.id);
      onNoteDelete?.(note.id);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error("Failed to delete note:", error);
    }
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

  const handleLabelToggle = async (labelId: number) => {
    try {
      const currentLabelIds = note.labels?.map(l => l.id) || [];
      const newLabelIds = currentLabelIds.includes(labelId)
        ? currentLabelIds.filter(id => id !== labelId)
        : [...currentLabelIds, labelId];

      await apiClient.notes.updateNote(note.id, { labels: newLabelIds });
      onRefetch?.(true);
    } catch (error) {
      console.error("Failed to update note labels:", error);
    }
  };

  const menuItems: MenuItem[] = [
    {
      id: "pin-unpin",
      label: note.is_pinned ? "Unpin" : "Pin",
      icon: note.is_pinned ? <PinOff className="size-4" /> : <Pin className="size-4" />,
      onClick: () => onPinToggle?.(),
    },
    {
      id: "labels",
      label: "Labels",
      icon: <Tag className="size-4" />,
      children: labels.map(label => ({
        id: `label-${label.id}`,
        label: label.name,
        checked: note.labels?.some(l => l.id === label.id) || false,
        onClick: () => handleLabelToggle(label.id),
      })),
    },
    {
      id: "export",
      label: "Export Note",
      icon: <Download className="size-4" />,
      children: [
        {
          id: "export-pdf",
          label: "Export as PDF",
          icon: <Download className="size-4" />,
          onClick: () => handleExport("pdf"),
        },
        {
          id: note.content_type === "markdown" ? "export-md" : "export-txt",
          label: note.content_type === "markdown" ? "Export as Markdown" : "Export as Text",
          icon: <Download className="size-4" />,
          onClick: () => handleExport(note.content_type === "markdown" ? "md" : "txt"),
        },
      ],
    },
    {
      id: "delete",
      label: "Delete",
      icon: <Trash className="size-4 text-red-600" />,
      onClick: handleDeleteClick,
    },
  ];

  return (
    <>
      <div
        className={cn(
          "px-4 h-11 flex items-center justify-between gap-3 flex-shrink-0 transition-all duration-200 ease-out",
          !constrainWidth || isMaximized ? "" : "rounded-b-2xl",
          isNoteHovered && !isDarkMode ? "bg-black/[0.06]" : "bg-black/[0.03]",
          isNoteHovered && isDarkMode ? "bg-white/[0.08]" : "bg-white/[0.04]"
        )}
        onClick={e => e.stopPropagation()}
      >
        {/* Left: Back button on mobile or Date */}
        <div className="flex items-center gap-1.5">
          {isMobile && onClose && (
            <Button
              variant="plain"
              icon={ChevronLeft}
              className="p-1"
              iconSize="5"
              onClick={onClose}
              title="Back"
            />
          )}
          <time className="text-[11px] text-[var(--text-secondary)] font-medium flex-shrink-0 whitespace-nowrap tracking-wide uppercase">
            {new Date(note.updated_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </time>
        </div>
        {/* Right: Labels & more button */}
        <div className="flex-1 h-full flex flex-row-reverse items-center">
          {constrainWidth ? (
            <Menu
              trigger={<MoreVertical className="size-4 text-[var(--text-secondary)]" />}
              items={menuItems}
              placement="bottom-end"
              menuClassName="z-[60]"
              title="Settings"
            />
          ) : (
            <div />
          )}
          {note.labels && note.labels.length > 0 ? (
            constrainWidth ? (
              <HoverCard
                className="flex-1 h-full"
                horizontalContentAlignment="center"
                openDelay={300}
                closeDelay={100}
              >
                <HoverCard.Trigger asChild>
                  <div className="relative h-full overflow-hidden">
                    {note.labels.map((label, index) => (
                      <LabelTag
                        key={label.id}
                        label={label}
                        className="absolute top-1/2 -translate-y-1/2"
                        style={{
                          zIndex: index,
                          right: `${((note.labels?.length ?? 0) - index) * 8}px`,
                        }}
                      />
                    ))}
                  </div>
                </HoverCard.Trigger>
                <HoverCard.Content className="p-3 max-w-xs bg-gray-200">
                  <div className="flex flex-wrap gap-1.5">
                    {note.labels.map(label => (
                      <LabelTag key={label.id} label={label} />
                    ))}
                  </div>
                </HoverCard.Content>
              </HoverCard>
            ) : (
              <div className="flex justify-end gap-1.5 overflow-x-scroll w-20 flex-1">
                {note.labels.map(label => (
                  <LabelTag
                    key={label.id}
                    label={label}
                    className="border-0 shadow-none flex-shrink-0 w-[unset] max-w-32"
                  />
                ))}
              </div>
            )
          ) : (
            <div className="h-full" />
          )}
        </div>
      </div>
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

export default NoteFooter;
