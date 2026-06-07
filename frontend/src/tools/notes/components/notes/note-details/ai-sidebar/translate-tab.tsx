import type { Note } from "@notes/types/note-types";
import { apiClient } from "@notes/utils/api";
import { Check, Languages, Loader2, X } from "lucide-react";
import React, { useState } from "react";
import { LANGUAGES } from "./types";

interface TranslateTabProps {
  note: Note;
  onNoteUpdate?: (updatedNote: Note) => void;
}

const TranslateTab: React.FC<TranslateTabProps> = ({ note, onNoteUpdate }) => {
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [translation, setTranslation] = useState<string | null>(null);
  const [translationLoading, setTranslationLoading] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);

  const handleTranslate = async () => {
    if (!selectedLanguage) return;

    setTranslationLoading(true);
    setTranslationError(null);
    setTranslation(null);

    try {
      const response = await apiClient.ai.translateNote(note.id, selectedLanguage);
      setTranslation(response.translated_content);
    } catch (err) {
      setTranslationError(err instanceof Error ? err.message : "Failed to translate note");
    } finally {
      setTranslationLoading(false);
    }
  };

  const handleApplyTranslation = async () => {
    if (!translation || !onNoteUpdate) return;

    try {
      const updatedNote = await apiClient.notes.updateNote(note.id, { content: translation });
      onNoteUpdate(updatedNote);
      setTranslation(null);
    } catch (err) {
      setTranslationError(err instanceof Error ? err.message : "Failed to apply translation");
    }
  };

  return (
    <div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select Language
        </label>
        <select
          value={selectedLanguage}
          onChange={e => setSelectedLanguage(e.target.value)}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Choose a language...</option>
          {LANGUAGES.map(lang => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={handleTranslate}
        disabled={!selectedLanguage || translationLoading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors mb-4"
      >
        {translationLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Translating...
          </>
        ) : (
          <>
            <Languages className="w-4 h-4" />
            Translate
          </>
        )}
      </button>

      {translation && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap mb-3">
            {translation}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleApplyTranslation}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-green-500 text-white hover:bg-green-600 transition-colors"
            >
              <Check className="w-4 h-4" />
              Apply
            </button>
            <button
              onClick={() => setTranslation(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-gray-500 text-white hover:bg-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
              Dismiss
            </button>
          </div>
        </div>
      )}

      {translationError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-sm text-red-600 dark:text-red-400">{translationError}</p>
        </div>
      )}
    </div>
  );
};

export default TranslateTab;
