import type { Note } from "@notes/types/note-types";
import Button from "@notes/ui/button";
import { cn } from "@notes/utils/css-utils";
import { Languages, MessageSquare, Sparkles, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import ChatTab from "./chat-tab";
import SummarizeTab from "./summarize-tab";
import TranslateTab from "./translate-tab";
import type { TabType } from "./types";
import { useIsMobile } from "@notes/hooks/use-is-mobile";

interface AISidebarProps {
  note: Note;
  isOpen: boolean;
  onClose: () => void;
  onNoteUpdate?: (updatedNote: Note) => void;
  bgColor?: string;
  textColor?: string;
}

const MIN_WIDTH = 300;
const MAX_WIDTH = 800;
const DEFAULT_WIDTH = 384;
const MIN_HEIGHT = 200;
const MAX_HEIGHT = 600;
const DEFAULT_HEIGHT = 400;
const STORAGE_KEY_WIDTH = "ai-sidebar-width";
const STORAGE_KEY_HEIGHT = "ai-sidebar-height";

const AISidebar: React.FC<AISidebarProps> = ({
  note,
  isOpen,
  onClose,
  onNoteUpdate,
  bgColor,
  textColor,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("chat");
  const [width, setWidth] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_WIDTH);
    return saved ? Number.parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const [height, setHeight] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_HEIGHT);
    return saved ? Number.parseInt(saved, 10) : DEFAULT_HEIGHT;
  });
  const [isResizing, setIsResizing] = useState(false);
  const isMobile = useIsMobile();
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!sidebarRef.current) return;
      const rect = sidebarRef.current.getBoundingClientRect();

      if (isMobile) {
        const newHeight = rect.bottom - e.clientY;
        const clampedHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, newHeight));
        setHeight(clampedHeight);
      } else {
        const newWidth = rect.right - e.clientX;
        const clampedWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth));
        setWidth(clampedWidth);
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

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
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
      {/* Resize Handle */}
      <div
        onMouseDown={handleMouseDown}
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
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">AI Assistant</h2>
        <Button
          onClick={onClose}
          className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md cursor-pointer"
          title="Close AI Assistant"
          icon={X}
          iconSize="4"
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab("chat")}
          className={cn(
            "flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2",
            activeTab === "chat"
              ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          )}
        >
          <MessageSquare className="w-4 h-4" />
          Chat
        </button>
        <button
          onClick={() => setActiveTab("summarize")}
          className={cn(
            "flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2",
            activeTab === "summarize"
              ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          )}
        >
          <Sparkles className="w-4 h-4" />
          Summarize
        </button>
        <button
          onClick={() => setActiveTab("translate")}
          className={cn(
            "flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2",
            activeTab === "translate"
              ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          )}
        >
          <Languages className="w-4 h-4" />
          Translate
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "chat" && <ChatTab note={note} />}
        {activeTab === "summarize" && <SummarizeTab note={note} onNoteUpdate={onNoteUpdate} />}
        {activeTab === "translate" && <TranslateTab note={note} onNoteUpdate={onNoteUpdate} />}
      </div>
    </div>
  );
};

export default AISidebar;
