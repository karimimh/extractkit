import type { Note } from "@notes/types/note-types";
import AutogrowingTextarea from "@notes/ui/input/auto-growing-text-area";
import MarkdownRenderer from "@notes/ui/markdown-renderer";
import { apiClient } from "@notes/utils/api";
import { cn } from "@notes/utils/css-utils";
import { Loader2, Send } from "lucide-react";
import React, { useState } from "react";
import type { ChatMessage } from "./types";

interface ChatTabProps {
  note: Note;
}

const ChatTab: React.FC<ChatTabProps> = ({ note }) => {
  const [chatPrompt, setChatPrompt] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatPrompt.trim()) return;

    const userMessage = chatPrompt.trim();
    setChatPrompt("");

    setChatMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setChatLoading(true);
    setChatError(null);

    try {
      const response = await apiClient.ai.generateNote(userMessage, note.id);
      setChatMessages(prev => [...prev, { role: "assistant", content: response.content }]);
    } catch (err) {
      setChatError(err instanceof Error ? err.message : "Failed to generate response");
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 mb-4 space-y-3 overflow-y-auto">
        {chatMessages.map((message, index) => (
          <div
            key={index}
            className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-lg p-3",
                message.role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              )}
            >
              <MarkdownRenderer
                content={message.content}
                bgColor={message.role === "user" ? "#3b82f6" : undefined}
                textColor={message.role === "user" ? "#ffffff" : undefined}
                className="text-sm"
                isPreview={true}
                disableSyntaxHighlighting={false}
              />
            </div>
          </div>
        ))}
        {chatLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
              <Loader2 className="w-4 h-4 animate-spin text-gray-600 dark:text-gray-400" />
            </div>
          </div>
        )}
        {chatError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p className="text-sm text-red-600 dark:text-red-400">{chatError}</p>
          </div>
        )}
      </div>
      <form onSubmit={handleChatSubmit} className="mt-auto">
        <div className="flex flex-col gap-2">
          <AutogrowingTextarea
            value={chatPrompt}
            onChange={setChatPrompt}
            placeholder="Ask me anything about this note..."
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            minRows={1}
            maxRows={5}
          />
          <button
            type="submit"
            disabled={!chatPrompt.trim() || chatLoading}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {chatLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatTab;
