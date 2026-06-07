import type { Note } from "@notes/types/note-types";
import type { Label } from "@notes/types/label-types";
import LoadingIndicator from "@notes/ui/loading-indicator";
import { cn } from "@notes/utils/css-utils";
import { useEffect, useRef } from "react";
import GridLayout from "./layouts/grid-layout";
import SortableGridLayout from "./layouts/sortable-grid-layout";
import NoNotesPlaceholder from "./no-notes-placeholder";
import { DragDropInfoBanner } from "./drag-drop-info-banner";
import { useDragDropInfo } from "@notes/hooks/use-drag-drop-info";

interface NotesContainerProps {
  notes: Note[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  onLoadMore: () => void;
  onNoteUpdate: (updatedNote: Note) => void;
  onNoteDelete: (noteId: number) => void;
  onRefetch?: (force?: boolean) => void;
  enableDragDrop?: boolean;
  className?: string;
  onCloseAiAssistant?: () => void;
  labels: Label[];
}

const NotesContainer: React.FC<NotesContainerProps> = ({
  notes,
  loading,
  loadingMore,
  error,
  hasMore,
  onLoadMore,
  onNoteUpdate,
  onNoteDelete,
  onRefetch,
  enableDragDrop = false,
  className,
  onCloseAiAssistant,
  labels,
}) => {
  const observerRef = useRef<HTMLDivElement>(null);
  const { showDragInfo, handleDragComplete, handleDismissBanner } = useDragDropInfo(enableDragDrop);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    if (loading || !hasMore) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentObserver = observerRef.current;
    if (currentObserver) {
      observer.observe(currentObserver);
    }

    return () => {
      if (currentObserver) {
        observer.unobserve(currentObserver);
      }
    };
  }, [loading, hasMore, loadingMore, onLoadMore]);
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <LoadingIndicator className="h-8 w-8 mx-auto mb-4" />
          <p className="text-gray-600">Loading your notes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Notes</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (notes.length === 0) {
    return <NoNotesPlaceholder />;
  }

  return (
    <div className={cn("w-full pb-12", className)}>
      {/* Show drag and drop info banner */}
      {showDragInfo && <DragDropInfoBanner onDismiss={handleDismissBanner} />}

      <div className="transition-opacity duration-150">
        {/* Use sortable layout when drag and drop is enabled */}
        {enableDragDrop ? (
          <SortableGridLayout
            className="w-full"
            notes={notes}
            onNoteUpdate={onNoteUpdate}
            onNoteDelete={onNoteDelete}
            onRefetch={onRefetch}
            onCloseAiAssistant={onCloseAiAssistant}
            onDragComplete={handleDragComplete}
            labels={labels}
          />
        ) : (
          <GridLayout
            className="w-full"
            notes={notes}
            onNoteUpdate={onNoteUpdate}
            onNoteDelete={onNoteDelete}
            onRefetch={onRefetch}
            onCloseAiAssistant={onCloseAiAssistant}
            labels={labels}
          />
        )}
      </div>

      {/* Infinite scroll trigger element */}
      {hasMore && (
        <div ref={observerRef} className="mt-8 flex justify-center">
          {loadingMore && (
            <div className="flex items-center gap-2 text-gray-600">
              <LoadingIndicator className="h-6 w-6" />
              <span>Loading more notes...</span>
            </div>
          )}
        </div>
      )}

      {!hasMore && notes.length > 0 && (
        <div className="mt-12 mb-8 flex flex-col items-center gap-3">
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-[var(--border-primary)] to-transparent" />
          <div className="text-center">
            <p className="text-[var(--text-secondary)] font-medium text-base">All notes loaded</p>
            <p className="text-[var(--text-tertiary)] text-sm mt-1">
              {notes.length} {notes.length === 1 ? "note" : "notes"} in total
            </p>
          </div>
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-[var(--border-primary)] to-transparent" />
        </div>
      )}
    </div>
  );
};

NotesContainer.displayName = "NotesContainer";

export default NotesContainer;
