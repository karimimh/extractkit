import type { Note, NoteHistoryEntry } from "@notes/types/note-types";
import Button from "@notes/ui/button";
import { cn } from "@notes/utils/css-utils";
import { formatNoteDateTime } from "@notes/utils/date-utils";
import { apiClient } from "@notes/utils/api";
import { ArrowLeft, ChevronRight, History, RotateCcw, X } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useIsMobile } from "@notes/hooks/use-is-mobile";

interface HistorySidebarProps {
  note: Note;
  isOpen: boolean;
  onClose: () => void;
  onNoteUpdate?: (updatedNote: Note) => void;
  bgColor?: string;
  textColor?: string;
}

const MIN_WIDTH = 280;
const MAX_WIDTH = 700;
const DEFAULT_WIDTH = 360;
const MIN_HEIGHT = 200;
const MAX_HEIGHT = 600;
const DEFAULT_HEIGHT = 400;
const STORAGE_KEY_WIDTH = "history-sidebar-width";
const STORAGE_KEY_HEIGHT = "history-sidebar-height";

const HistorySidebar: React.FC<HistorySidebarProps> = ({
  note,
  isOpen,
  onClose,
  onNoteUpdate,
  bgColor,
  textColor,
}) => {
  const isMobile = useIsMobile();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [width, setWidth] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_WIDTH);
    return saved ? Number.parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const [height, setHeight] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_HEIGHT);
    return saved ? Number.parseInt(saved, 10) : DEFAULT_HEIGHT;
  });

  const [entries, setEntries] = useState<NoteHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<NoteHistoryEntry | null>(null);
  const [restoring, setRestoring] = useState(false);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.notes.fetchNoteHistory(note.id);
      setEntries(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [note.id]);

  useEffect(() => {
    if (isOpen) {
      setSelected(null);
      fetchHistory();
    }
  }, [isOpen, note.id, fetchHistory]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!sidebarRef.current) return;
      const rect = sidebarRef.current.getBoundingClientRect();
      if (isMobile) {
        const newHeight = rect.bottom - e.clientY;
        setHeight(Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, newHeight)));
      } else {
        const newWidth = rect.right - e.clientX;
        setWidth(Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth)));
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      if (isMobile) {
        localStorage.setItem(STORAGE_KEY_HEIGHT, height.toString());
      } else {
        localStorage.setItem(STORAGE_KEY_WIDTH, width.toString());
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, width, height, isMobile]);

  const handleRestore = async (entry: NoteHistoryEntry) => {
    setRestoring(true);
    try {
      const updated = await apiClient.notes.restoreNoteHistory(note.id, entry.id);
      onNoteUpdate?.(updated);
      await fetchHistory();
      setSelected(null);
    } catch {
      // silently fail
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div
      ref={sidebarRef}
      className={cn(
        "absolute flex flex-col z-20 transition-transform duration-300",
        isMobile
          ? cn(
              "left-0 right-0 bottom-0 shadow-[0_-1px_4px_rgba(0,0,0,0.1)]",
              isOpen ? "translate-y-0" : "translate-y-full"
            )
          : cn(
              "top-15 right-0 bottom-10 shadow-[-1px_0_4px_rgba(0,0,0,0.1)]",
              isOpen ? "translate-x-0" : "translate-x-full"
            )
      )}
      style={{
        width: isMobile ? "100%" : `${width}px`,
        height: isMobile ? `${height}px` : "auto",
        backgroundColor: bgColor,
        color: textColor,
      }}
    >
      {/* Resize handle */}
      <div
        onMouseDown={e => {
          e.preventDefault();
          setIsResizing(true);
        }}
        className={cn(
          "absolute transition-colors",
          isMobile
            ? cn(
                "left-0 right-0 top-0 h-1 cursor-row-resize hover:bg-blue-500",
                isResizing && "bg-blue-500"
              )
            : cn(
                "left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500",
                isResizing && "bg-blue-500"
              )
        )}
        style={
          isMobile ? { height: "4px", marginTop: "-2px" } : { width: "4px", marginLeft: "-2px" }
        }
      />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 shrink-0">
        <div className="flex items-center gap-2">
          {selected && (
            <Button
              variant="plain"
              icon={ArrowLeft}
              iconSize="4"
              className="p-1 -ml-1"
              onClick={() => setSelected(null)}
              title="Back to list"
            />
          )}
          <History className="w-4 h-4" />
          <h2 className="text-base font-semibold">{selected ? "Version preview" : "History"}</h2>
        </div>
        <Button
          variant="plain"
          icon={X}
          iconSize="4"
          className="p-1"
          onClick={onClose}
          title="Close history"
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {selected ? (
          <div className="flex flex-col h-full">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 shrink-0 flex items-center justify-between gap-2">
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {formatNoteDateTime(selected.saved_at)}
              </div>
              <Button
                variant="plain"
                icon={RotateCcw}
                iconSize="4"
                className="p-1 shrink-0 text-teal-700"
                onClick={() => handleRestore(selected)}
                title="Restore this version"
                disabled={restoring}
              />
            </div>
            {selected.title && <div className="px-4 pt-3 text-sm font-bold">{selected.title}</div>}
            <pre className="px-4 py-3 text-xs font-mono whitespace-pre-wrap break-words flex-1 overflow-y-auto leading-relaxed">
              {selected.content || <span className="text-gray-400 italic">Empty</span>}
            </pre>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-24 text-sm text-gray-400">
            Loading…
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 gap-2 text-sm text-gray-400">
            <History className="w-5 h-5" />
            <span>No history yet</span>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {entries.map(entry => (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => setSelected(entry)}
                  className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <div className="flex flex-col gap-0.5 overflow-hidden">
                    <span className="text-xs font-medium truncate">
                      {entry.title || <span className="text-gray-400 italic">Untitled</span>}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {formatNoteDateTime(entry.saved_at)}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 truncate">
                      {entry.content ? (
                        entry.content.slice(0, 60) + (entry.content.length > 60 ? "…" : "")
                      ) : (
                        <span className="italic">Empty</span>
                      )}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 shrink-0 text-gray-400" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default HistorySidebar;
