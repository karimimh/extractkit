import Select from "@notes/ui/select";
import { ArrowDownWideNarrow, ArrowUpDown, ArrowUpNarrowWide, Check, Grip } from "lucide-react";
export interface SortOption {
  orderBy: "updated_at" | "created_at" | "title" | "content_type" | "order";
  orderDirection: "asc" | "desc";
}

interface SortOptionsSelectorProps {
  currentSort?: SortOption;
  onSortChange?: (sort: SortOption) => void;
}

const SortOptionsSelector: React.FC<SortOptionsSelectorProps> = ({ currentSort, onSortChange }) => {
  const createSortOptions = () => {
    const sortOptions = [
      { orderBy: "updated_at", orderDirection: "desc", label: "Update Date" },
      { orderBy: "updated_at", orderDirection: "asc", label: "Update Date" },
      { orderBy: "created_at", orderDirection: "desc", label: "Create Date" },
      { orderBy: "created_at", orderDirection: "asc", label: "Create Date" },
      { orderBy: "title", orderDirection: "desc", label: "Title" },
      { orderBy: "title", orderDirection: "asc", label: "Title" },
      { orderBy: "order", orderDirection: "asc", label: "Custom" },
    ] as const;

    return sortOptions;
  };

  const getCurrentSortValue = () => {
    if (!currentSort) return "updated_at-desc";
    return `${currentSort.orderBy}-${currentSort.orderDirection}`;
  };

  const getCurrentLabel = () => {
    const currentValue = getCurrentSortValue();
    const option = createSortOptions().find(
      opt => `${opt.orderBy}-${opt.orderDirection}` === currentValue
    );
    return option?.label || "Update Date";
  };

  const handleSortValueChange = (value: string) => {
    const [orderBy, orderDirection] = value.split("-");
    onSortChange?.({
      orderBy: orderBy as SortOption["orderBy"],
      orderDirection: orderDirection as SortOption["orderDirection"],
    });
  };

  const isAscending = currentSort?.orderDirection === "asc";

  return (
    <Select value={getCurrentSortValue()} onValueChange={handleSortValueChange}>
      <Select.Trigger className="text-xs" raw>
        <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 text-[var(--text-primary)] bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-md shadow-sm hover:bg-[var(--bg-hover)] dark:hover:bg-[var(--bg-hover-dark)] transition-colors">
          {currentSort?.orderBy === "order" ? (
            <Grip className="size-3.5 sm:hidden flex-shrink-0" />
          ) : (
            <ArrowUpDown className="size-3.5 sm:hidden flex-shrink-0" />
          )}
          {currentSort?.orderBy === "order" ? (
            <Grip className="hidden sm:block size-4 flex-shrink-0" />
          ) : isAscending ? (
            <ArrowUpNarrowWide className="hidden sm:block size-4 flex-shrink-0" />
          ) : (
            <ArrowDownWideNarrow className="hidden sm:block size-4 flex-shrink-0" />
          )}
          <span className="hidden sm:inline text-xs font-medium">{getCurrentLabel()}</span>
        </div>
      </Select.Trigger>
      <Select.Content className="border-[var(--border-primary)]">
        {createSortOptions().map(option => {
          const optionValue = `${option.orderBy}-${option.orderDirection}`;
          const isSelected = getCurrentSortValue() === optionValue;

          return (
            <Select.Item
              className="rounded-md overflow-clip bg-[var(--bg-primary)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
              key={optionValue}
              value={optionValue}
            >
              <div className="flex items-center gap-2">
                {option.orderBy === "order" ? (
                  <Grip className="size-4" />
                ) : option.orderDirection === "asc" ? (
                  <ArrowUpNarrowWide className="w-4 h-4" />
                ) : (
                  <ArrowDownWideNarrow className="w-4 h-4" />
                )}
                <span className="flex-1">{option.label}</span>
                {isSelected && <Check className="w-4 h-4 text-blue-600" />}
              </div>
            </Select.Item>
          );
        })}
      </Select.Content>
    </Select>
  );
};

export default SortOptionsSelector;
