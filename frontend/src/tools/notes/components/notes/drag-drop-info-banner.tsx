import { Info, X } from "lucide-react";
import { cn } from "@notes/utils/css-utils";

interface DragDropInfoBannerProps {
  onDismiss: () => void;
  className?: string;
}

export const DragDropInfoBanner: React.FC<DragDropInfoBannerProps> = ({ onDismiss, className }) => {
  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 mb-4 rounded-lg border",
        "bg-blue-50 border-blue-200 text-blue-900",
        "dark:bg-blue-950/20 dark:border-blue-800 dark:text-blue-100",
        className
      )}
    >
      <Info className="w-5 h-5 shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-medium">You can reorder notes by dragging and dropping them</p>
      </div>
      <button
        onClick={onDismiss}
        className="shrink-0 p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
