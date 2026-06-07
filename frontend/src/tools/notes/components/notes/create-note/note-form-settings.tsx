import { LabelSelector } from "@notes/components/labels";
import { useIsMobile } from "@notes/hooks/use-is-mobile";
import MultiwaySwitch from "@notes/ui/multiway-switch";
import Popover from "@notes/ui/popover";
import type { CreateNoteData } from "@notes/utils/api";
import { Settings } from "lucide-react";
import React from "react";
import ColorControls from "../note-details/note-color-controls";

interface NoteFormSettingsProps {
  formData: CreateNoteData;
  onFormDataChange: (updates: Partial<CreateNoteData>) => void;
}

const NoteFormSettings: React.FC<NoteFormSettingsProps> = ({ formData, onFormDataChange }) => {
  const isMobile = useIsMobile();

  const handleColorChange = (textColor: string, bgColor: string) => {
    onFormDataChange({ color: textColor, bg_color: bgColor });
  };

  const handleLabelsChange = (labelIds: number[]) => {
    onFormDataChange({ labels: labelIds });
  };

  const handleContentTypeChange = (type: "text" | "markdown") => {
    onFormDataChange({ content_type: type });
  };

  return (
    <Popover horizontalContentAlignment="right" mobileVariant="drawer">
      <Popover.Trigger
        className="p-1"
        variant="plain"
        icon={Settings}
        iconSize={isMobile ? "4" : "5"}
        title="Note Settings"
      />
      <Popover.Content className="p-3 sm:p-6 min-w-96 border border-[var(--border-primary)] rounded-lg">
        <div className="flex flex-col items-start gap-4 text-sm w-full">
          {/* Color Controls */}
          <ColorControls
            textColor={formData.color}
            bgColor={formData.bg_color}
            onColorChange={handleColorChange}
          />
          {/* Divider */}
          <div className="w-full border-t border-[var(--border-primary)]" />
          <div>
            <h3 className="font-medium text-[var(--text-secondary)] mb-2">Labels</h3>
            <LabelSelector
              selectedLabelIds={formData.labels || []}
              onLabelsChange={handleLabelsChange}
            />
          </div>
          {/* Divider */}
          <div className="w-full border-t border-[var(--border-primary)]" />
          <div>
            <h3 className="font-medium text-[var(--text-secondary)] mb-2">Content Type</h3>
            <MultiwaySwitch
              className="border border-blue-400/40"
              itemClassName="w-28"
              items={[
                { value: "markdown", title: "markdown" },
                { value: "text", title: "raw text" },
              ]}
              value={formData.content_type}
              onChange={value => handleContentTypeChange(value as "text" | "markdown")}
            />
          </div>
        </div>
      </Popover.Content>
    </Popover>
  );
};

export default NoteFormSettings;
