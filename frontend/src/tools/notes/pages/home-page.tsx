import AuthenticationLoading from "@notes/components/auth/authentication-loading";
import AiAssistantButton from "@notes/components/header/ai-assistant-button";
import Header from "@notes/components/header/Header";
import NoteFormMobile from "@notes/components/notes/create-note/note-form-mobile";
import { PinnedNotesSection } from "@notes/components/notes/pinned-notes-section";
import type { SortOption } from "@notes/components/sort-options-selector";
import { AIAssistant } from "@notes/components/subscription/ai-assistant";
import { useSubscription } from "@notes/context/SubscriptionContext";
import { useIsMobile } from "@notes/hooks/use-is-mobile";
import type { Label } from "@notes/types/label-types";
import type { Note, PaginationData } from "@notes/types/note-types";
import { apiClient, type FetchNotesParams } from "@notes/utils/api";
import { cn } from "@notes/utils/css-utils";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import NotesContainer from "../components/notes/notes-container";
import { SubscriptionLimitWarning } from "../components/subscription/SubscriptionLimitWarning";
import { UpgradeDialog } from "../components/subscription/UpgradeDialog";
import { useAuth } from "../hooks/use-auth";
import useLocalStorage from "../hooks/use-local-storage";
import LandingPage from "./landing-page";

const HomePage: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const { isPro } = useSubscription();
  const [labels, setLabels] = useState<Label[]>([]);
  const [sortOption, setSortOption] = useLocalStorage<SortOption>("note-sort-option", {
    orderBy: "updated_at",
    orderDirection: "desc",
  });

  // Get search query from URL params or default to empty string
  const searchQueryFromUrl = searchParams.get("search") || "";
  const [searchQuery, setSearchQuery] = useState(searchQueryFromUrl);

  // Get label filter from URL params or default to empty array (All Notes)
  const labelIdsFromUrl = searchParams.get("labels");
  const [selectedLabelIds, setSelectedLabelIds] = useState<number[]>(
    labelIdsFromUrl
      ? labelIdsFromUrl
          .split(",")
          .map(id => parseInt(id, 10))
          .filter(id => !isNaN(id))
      : []
  );

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    page_size: 20,
    total_pages: 1,
    total_count: 0,
    has_next: false,
    has_previous: false,
  });

  // Use ref to prevent double fetching when multiple dependencies change at once
  const isFetchingRef = useRef(false);

  // Store the last known version to compare on refetch
  const lastVersionRef = useRef<string | null>(null);
  const lastCountRef = useRef<number>(0);

  // Fetch labels when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      apiClient.labels
        .fetchLabels()
        .then(response => {
          setLabels(response.labels);
        })
        .catch(error => {
          console.error("Failed to fetch labels:", error);
        });
    }
  }, [isAuthenticated]);

  const fetchNotes = useCallback(
    async (
      search?: string,
      sort?: SortOption,
      page?: number,
      pageSize?: number,
      labelIds?: number[],
      appendResults = false
    ) => {
      // Prevent concurrent fetches
      if (isFetchingRef.current) {
        return;
      }

      try {
        isFetchingRef.current = true;
        if (appendResults) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }
        setError(null);
        const params: FetchNotesParams = {
          searchQuery: search,
          orderBy: sort?.orderBy || sortOption.orderBy,
          orderDirection: sort?.orderDirection || sortOption.orderDirection,
          page: page || 1,
          page_size: pageSize || 20,
        };

        // Add label filter if labels are selected
        if (labelIds && labelIds.length > 0) {
          params.labels = labelIds.join(",");
        }

        const response = await apiClient.notes.fetchNotes(params);
        if (appendResults) {
          setNotes(prev => {
            const newNoteIds = new Set(response.notes.map(note => note.id));
            const filteredPrev = prev.filter(note => !newNoteIds.has(note.id));
            return [...filteredPrev, ...response.notes];
          });
        } else {
          setNotes(response.notes);
        }
        setPagination(response.pagination);

        // Update the version tracking after successful fetch
        if (!appendResults) {
          const versionData = await apiClient.notes.fetchNotesVersion();
          lastVersionRef.current = versionData.version;
          lastCountRef.current = versionData.count;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch notes");
      } finally {
        setLoading(false);
        setLoadingMore(false);
        isFetchingRef.current = false;
      }
    },
    [sortOption.orderBy, sortOption.orderDirection]
  );

  // Fetch notes when component mounts or dependencies change
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      fetchNotes(searchQuery, sortOption, 1, 20, selectedLabelIds, false); // Reset to page 1 when search/sort/label changes
    }
  }, [searchQuery, selectedLabelIds, sortOption, fetchNotes, isAuthenticated, isLoading]);

  const handleLoadMore = useCallback(() => {
    if (pagination.has_next && !loadingMore && !loading) {
      fetchNotes(searchQuery, sortOption, pagination.page + 1, 20, selectedLabelIds, true);
    }
  }, [fetchNotes, searchQuery, sortOption, selectedLabelIds, pagination, loadingMore, loading]);

  const handleNoteUpdate = useCallback((updatedNote: Note) => {
    // Update the note in the notes list
    setNotes(prev => prev.map(note => (note.id === updatedNote.id ? updatedNote : note)));
  }, []);

  const smartRefetchNotes = useCallback(
    async (force = false) => {
      try {
        // If force is true, skip version check and refetch immediately
        if (force) {
          await fetchNotes(searchQuery, sortOption, 1, 20, selectedLabelIds);
          return;
        }

        // First, check the version to see if notes have changed
        const versionData = await apiClient.notes.fetchNotesVersion();

        // Only refetch if version or count has changed
        if (
          versionData.version !== lastVersionRef.current ||
          versionData.count !== lastCountRef.current
        ) {
          await fetchNotes(searchQuery, sortOption, 1, 20, selectedLabelIds);
        }
      } catch (error) {
        console.error("Error checking notes version:", error);
        // If version check fails, fallback to regular refetch
        await fetchNotes(searchQuery, sortOption, 1, 20, selectedLabelIds);
      }
    },
    [fetchNotes, searchQuery, sortOption, selectedLabelIds]
  );

  const handleNoteDelete = useCallback(
    (noteId: number) => {
      // Remove the deleted note from the notes list immediately for instant feedback
      setNotes(prev => prev.filter(note => note.id !== noteId));
      // Refetch to ensure consistency with backend
      smartRefetchNotes();
    },
    [smartRefetchNotes]
  );

  // Update states when URL params change
  useEffect(() => {
    const urlSearch = searchParams.get("search") || "";
    const urlLabelsParam = searchParams.get("labels");

    if (urlSearch !== searchQuery) {
      setSearchQuery(urlSearch);
    }

    const newLabelIds = urlLabelsParam
      ? urlLabelsParam
          .split(",")
          .map(id => parseInt(id, 10))
          .filter(id => !isNaN(id))
      : [];

    const labelIdsChanged =
      newLabelIds.length !== selectedLabelIds.length ||
      !newLabelIds.every(id => selectedLabelIds.includes(id));

    if (labelIdsChanged) {
      setSelectedLabelIds(newLabelIds);
    }
  }, [searchParams, searchQuery, selectedLabelIds]);

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);

      // Update URL search params
      const newSearchParams = new URLSearchParams(searchParams);
      if (query.trim()) {
        newSearchParams.set("search", query);
      } else {
        newSearchParams.delete("search");
      }
      setSearchParams(newSearchParams);
    },
    [searchParams, setSearchParams]
  );

  const handleSortChange = (newSort: SortOption) => {
    setSortOption(newSort);
  };

  const handleLabelChange = (labelIds: number[]) => {
    setSelectedLabelIds(labelIds);

    // Update URL search params
    const newSearchParams = new URLSearchParams(searchParams);
    if (labelIds.length > 0) {
      newSearchParams.set("labels", labelIds.join(","));
    } else {
      newSearchParams.delete("labels");
    }
    setSearchParams(newSearchParams);
  };

  if (isLoading) {
    return <AuthenticationLoading />;
  }

  return (
    <div className="min-h-screen flex flex-col relative gap-4 overflow-x-clip">
      {/* Gradient background */}
      {/* <div
        className="absolute inset-x-0 top-0 pointer-events-none z-0 h-[40rem]"
        style={{
          background: "var(--gradient-home-bg)",
        }}
      /> */}
      <Header
        onSearch={handleSearch}
        onNoteCreated={smartRefetchNotes}
        selectedLabelIds={selectedLabelIds}
        onLabelChange={handleLabelChange}
        currentSort={sortOption}
        onSortChange={handleSortChange}
        onRefetch={() => smartRefetchNotes(true)}
        isLoading={loading}
        totalNotesCount={pagination.total_count}
        aiAssistantOpen={isAiAssistantOpen}
        setAiAssistantOpen={setIsAiAssistantOpen}
        isPro={isPro}
      />
      <AIAssistant
        isOpen={isAiAssistantOpen}
        onOpenChange={setIsAiAssistantOpen}
        onNotesChanged={() => smartRefetchNotes(true)}
      />
      <main className="flex-1 relative z-10 transition-transform">
        {isAuthenticated ? (
          <>
            <SubscriptionLimitWarning onUpgradeClick={() => setUpgradeDialogOpen(true)} />
            <div className={cn("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8")}>
              {/* Pinned Notes Section - Hide when using custom order */}
              {sortOption.orderBy !== "order" && (
                <PinnedNotesSection
                  notes={notes}
                  onNoteUpdate={handleNoteUpdate}
                  onNoteDelete={handleNoteDelete}
                  onRefetch={smartRefetchNotes}
                  onCloseAiAssistant={() => setIsAiAssistantOpen(false)}
                  labels={labels}
                />
              )}

              {/* Other Notes Section */}
              <NotesContainer
                notes={
                  sortOption.orderBy === "order" ? notes : notes.filter(note => !note.is_pinned)
                }
                loading={loading}
                loadingMore={loadingMore}
                error={error}
                hasMore={pagination.has_next}
                onLoadMore={handleLoadMore}
                onNoteUpdate={handleNoteUpdate}
                onNoteDelete={handleNoteDelete}
                onRefetch={smartRefetchNotes}
                enableDragDrop={sortOption.orderBy === "order"}
                onCloseAiAssistant={() => setIsAiAssistantOpen(false)}
                labels={labels}
              />
            </div>
            <NoteFormMobile onNoteCreated={smartRefetchNotes} />
            <div className="flex-1 sm:hidden justify-end items-center">
              <AiAssistantButton
                isMobile={isMobile}
                aiAssistantOpen={isAiAssistantOpen}
                setAiAssistantOpen={open => {
                  if (!isPro) {
                    setUpgradeDialogOpen(true);
                    return;
                  }
                  setIsAiAssistantOpen(open);
                }}
              />
            </div>
            <UpgradeDialog
              open={upgradeDialogOpen}
              onOpenChange={setUpgradeDialogOpen}
              hideTrigger
            />
          </>
        ) : (
          <LandingPage />
        )}
      </main>
    </div>
  );
};

export default HomePage;
