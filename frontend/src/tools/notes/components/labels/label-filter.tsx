import type { Label } from "@notes/types/label-types";
import Button from "@notes/ui/button";
import LoadingIndicator from "@notes/ui/loading-indicator";
import MultichoiceDropdown from "@notes/ui/multichoice-dropdown";
import { apiClient } from "@notes/utils/api";
import { cn } from "@notes/utils/css-utils";
import { ChevronDown, PenBox } from "lucide-react";
import React, { useEffect, useState } from "react";
import LabelTag from "./label-tag";
import LabelsManagementDialog from "./labels-management-dialog";

interface LabelFilterProps {
  selectedLabelIds?: number[]; // empty array means "All Notes"
  onLabelChange: (labelIds: number[]) => void;
  className?: string;
}

const LabelFilter: React.FC<LabelFilterProps> = ({
  selectedLabelIds = [],
  onLabelChange,
  className,
}) => {
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(false);
  const [showLabelsDialog, setShowLabelsDialog] = useState(false);

  useEffect(() => {
    fetchLabels();
  }, []);

  const fetchLabels = async () => {
    try {
      setLoading(true);
      const response = await apiClient.labels.fetchLabels();
      setLabels(response.labels);
    } catch (error) {
      console.error("Failed to fetch labels:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectionChange = (selectedIds: string[]) => {
    const labelIds = selectedIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
    onLabelChange(labelIds);
  };

  const handleToggleAll = () => {
    if (selectedLabelIds.length === labels.length) {
      onLabelChange([]);
    } else {
      onLabelChange(labels.map(label => label.id));
    }
  };

  const allSelected = labels.length > 0 && selectedLabelIds.length === labels.length;
  const someSelected = selectedLabelIds.length > 0 && selectedLabelIds.length < labels.length;

  // Get selected labels for display
  const selectedLabels = labels.filter(label => selectedLabelIds.includes(label.id));

  if (loading) {
    return (
      <div className={cn("flex items-center", className)}>
        <LoadingIndicator className="h-4 w-4" />
      </div>
    );
  }

  return (
    <>
      <MultichoiceDropdown
        className={className}
        selectedIds={selectedLabelIds.map(id => id.toString())}
        onSelectionChange={handleSelectionChange}
        searchPlaceholder="Search labels..."
        searchInputClassName="w-36"
      >
        <MultichoiceDropdown.Trigger>
          <div className="flex items-center justify-between w-48 gap-1 px-3 py-1.5 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-primary)] text-[var(--text-primary)] shadow-sm text-sm">
            {selectedLabels.length === 0 ? (
              <span className="px-2 h-6 flex items-center">All Notes</span>
            ) : (
              <>
                {selectedLabels.slice(0, 2).map(label => (
                  <LabelTag
                    key={label.id}
                    label={{ id: label.id, name: label.name, color: label.color }}
                  />
                ))}
                {selectedLabels.length > 2 && (
                  <span className="text-xs text-[var(--text-secondary)]">
                    +{selectedLabels.length - 2}
                  </span>
                )}
              </>
            )}
            <ChevronDown className="size-4" />
          </div>
        </MultichoiceDropdown.Trigger>
        <MultichoiceDropdown.Header>
          <input
            type="checkbox"
            checked={allSelected}
            ref={input => {
              if (input) {
                input.indeterminate = someSelected;
              }
            }}
            onChange={handleToggleAll}
            className="cursor-pointer"
            title={allSelected ? "Deselect All" : "Select All"}
          />
        </MultichoiceDropdown.Header>
        <MultichoiceDropdown.Content className="max-w-xs">
          {labels.map(label => (
            <MultichoiceDropdown.Choice
              key={label.id}
              id={label.id.toString()}
              searchText={label.name}
            >
              <LabelTag
                label={{ id: label.id, name: label.name, color: label.color }}
                className="w-36"
              />
            </MultichoiceDropdown.Choice>
          ))}
        </MultichoiceDropdown.Content>
        <MultichoiceDropdown.Footer>
          <Button
            className="px-2 py-1 text-[var(--text-tertiary)] justify-center w-full"
            variant="plain"
            icon={PenBox}
            text="edit labels"
            onClick={() => setShowLabelsDialog(true)}
          />
        </MultichoiceDropdown.Footer>
      </MultichoiceDropdown>

      <LabelsManagementDialog
        isOpen={showLabelsDialog}
        onOpenChange={open => {
          setShowLabelsDialog(open);
          if (!open) {
            fetchLabels();
          }
        }}
      />
    </>
  );
};

export default LabelFilter;
