import React from "react";
import { Plus } from "lucide-react";
import { cn } from "@notes/utils/css-utils";
import { useLabels } from "@notes/hooks/use-labels";
import MultichoiceDropdown from "@notes/ui/multichoice-dropdown";
import LabelTag from "./label-tag";
import LoadingIndicator from "@notes/ui/loading-indicator";

interface LabelSelectorProps {
  selectedLabelIds: number[];
  onLabelsChange: (labelIds: number[]) => void;
  className?: string;
}

const LabelSelector: React.FC<LabelSelectorProps> = ({
  selectedLabelIds,
  onLabelsChange,
  className,
}) => {
  const { labels, loading } = useLabels();

  const handleSelectionChange = (selectedIds: string[]) => {
    const labelIds = selectedIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
    onLabelsChange(labelIds);
  };

  const selectedLabels = labels.filter(label => selectedLabelIds.includes(label.id));

  if (loading) {
    return (
      <div className={cn("flex items-center", className)}>
        <LoadingIndicator className="h-4 w-4" />
      </div>
    );
  }

  if (labels.length === 0) {
    return (
      <div className={cn("text-xs text-gray-500 px-2 py-1", className)}>
        No labels available. Create labels from the header menu.
      </div>
    );
  }

  return (
    <MultichoiceDropdown
      className={className}
      selectedIds={selectedLabelIds.map(id => id.toString())}
      onSelectionChange={handleSelectionChange}
      searchPlaceholder="Search labels..."
      searchInputClassName="w-36"
    >
      <MultichoiceDropdown.Trigger>
        <div className="flex items-center gap-1 px-2 py-1.5 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-primary)] text-[var(--text-primary)] shadow-sm text-sm">
          {selectedLabels.length === 0 ? (
            <div className="flex items-center gap-1">
              <Plus className="w-3 h-3" />
              <span>add label</span>
            </div>
          ) : (
            <>
              {selectedLabels.slice(0, 2).map(label => (
                <LabelTag
                  key={label.id}
                  label={{ id: label.id, name: label.name, color: label.color }}
                  className="w-[unset] max-w-32"
                />
              ))}
              {selectedLabels.length > 2 && (
                <span className="text-xs text-[var(--text-secondary)]">
                  +{selectedLabels.length - 2}
                </span>
              )}
            </>
          )}
        </div>
      </MultichoiceDropdown.Trigger>
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
    </MultichoiceDropdown>
  );
};

export default LabelSelector;
