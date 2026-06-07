import type { Note } from "@notes/types/note-types";
import { apiClient } from "@notes/utils/api";
import { Check, Loader2, Sparkles, X } from "lucide-react";
import React, { useState } from "react";
import { MIN_CONTENT_LENGTH } from "./types";

interface SummarizeTabProps {
  note: Note;
  onNoteUpdate?: (updatedNote: Note) => void;
}

const SummarizeTab: React.FC<SummarizeTabProps> = ({ note, onNoteUpdate }) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const isSummarizeEnabled = note.content.length >= MIN_CONTENT_LENGTH;

  const handleSummarize = async () => {
    setSummaryLoading(true);
    setSummaryError(null);
    setSummary(null);

    try {
      const response = await apiClient.ai.summarizeNote(note.id);
      setSummary(response.summary);
    } catch (err) {
      setSummaryError(err instanceof Error ? err.message : "Failed to summarize note");
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleApplySummary = async () => {
    if (!summary || !onNoteUpdate) return;

    try {
      const updatedNote = await apiClient.notes.updateNote(note.id, { content: summary });
      onNoteUpdate(updatedNote);
      setSummary(null);
    } catch (err) {
      setSummaryError(err instanceof Error ? err.message : "Failed to apply summary");
    }
  };

  return (
    <div>
      <button
        onClick={handleSummarize}
        disabled={!isSummarizeEnabled || summaryLoading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors mb-4"
        title={
          !isSummarizeEnabled
            ? `Note must have at least ${MIN_CONTENT_LENGTH} characters`
            : "Summarize note"
        }
      >
        {summaryLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Summarizing...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Summarize
          </>
        )}
      </button>

      {summary && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap mb-3">
            {summary}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleApplySummary}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-green-500 text-white hover:bg-green-600 transition-colors"
            >
              <Check className="w-4 h-4" />
              Apply
            </button>
            <button
              onClick={() => setSummary(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-gray-500 text-white hover:bg-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
              Dismiss
            </button>
          </div>
        </div>
      )}

      {summaryError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-sm text-red-600 dark:text-red-400">{summaryError}</p>
        </div>
      )}
    </div>
  );
};

export default SummarizeTab;
