import { AlertCircle, Crown } from "lucide-react";
import { useSubscription } from "@notes/context/SubscriptionContext";

interface SubscriptionLimitWarningProps {
  onUpgradeClick?: () => void;
}

export function SubscriptionLimitWarning({ onUpgradeClick }: SubscriptionLimitWarningProps) {
  const { subscription, isPro } = useSubscription();

  if (isPro || !subscription) return null;

  const noteCount = subscription.current_note_count ?? 0;
  const maxNotes = subscription.max_notes ?? 100;
  const notePercentage = (noteCount / maxNotes) * 100;

  const storageUsed = subscription.current_storage_mb ?? 0;
  const maxStorageMB = subscription.max_storage_bytes
    ? subscription.max_storage_bytes / (1024 * 1024)
    : 20;
  const storagePercentage = (storageUsed / maxStorageMB) * 100;

  // Show warning if approaching limits (>80%)
  const showNoteWarning = notePercentage > 80;
  const showStorageWarning = storagePercentage > 80;

  if (!showNoteWarning && !showStorageWarning) return null;

  return (
    <div className="mx-auto mb-4 p-3 max-w-[calc(100%-2rem)] sm:max-w-6xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
      <div className="flex items-start gap-2">
        <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
            Approaching Storage Limit
          </h4>
          <div className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
            {showNoteWarning && (
              <p>
                Notes: {noteCount} / {maxNotes} ({notePercentage.toFixed(0)}%)
              </p>
            )}
            {showStorageWarning && (
              <p>
                Storage: {storageUsed.toFixed(1)}MB / {maxStorageMB}MB (
                {storagePercentage.toFixed(0)}%)
              </p>
            )}
          </div>
          <button
            onClick={onUpgradeClick}
            className="mt-2 flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            <Crown className="w-3 h-3" />
            Upgrade to Pro for unlimited access
          </button>
        </div>
      </div>
    </div>
  );
}
