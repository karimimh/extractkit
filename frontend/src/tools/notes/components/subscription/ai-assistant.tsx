import { useSubscription } from "@notes/context/SubscriptionContext";
import { useIsMobile } from "@notes/hooks/use-is-mobile";
import Button from "@notes/ui/button";
import { apiClient, type AIAssistantActionResult, type AIAssistantMessage } from "@notes/utils/api";
import { cn } from "@notes/utils/css-utils";
import { showError, showSuccess } from "@notes/utils/toast-handler";
import {
  Bot,
  ChevronsDown,
  ChevronsRight,
  Crown,
  Send,
  Sparkles,
  Trash2,
  User,
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";

interface AIAssistantProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onNotesChanged?: () => void;
}

interface ChatMessage extends AIAssistantMessage {
  id: string;
  timestamp: Date;
  actions?: AIAssistantActionResult[];
  isLoading?: boolean;
}

export function AIAssistant({ isOpen, onOpenChange, onNotesChanged }: AIAssistantProps) {
  const { isPro } = useSubscription();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const generateMessageId = () => `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: generateMessageId(),
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    const loadingMessage: ChatMessage = {
      id: generateMessageId(),
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isLoading: true,
    };
    setMessages(prev => [...prev, loadingMessage]);

    try {
      const conversationHistory: AIAssistantMessage[] = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await apiClient.ai.sendAIAssistantMessage(
        userMessage.content,
        conversationHistory
      );

      const assistantMessage: ChatMessage = {
        id: loadingMessage.id,
        role: "assistant",
        content: response.response,
        timestamp: new Date(),
        actions: response.actions,
      };

      setMessages(prev => prev.map(m => (m.id === loadingMessage.id ? assistantMessage : m)));

      if (response.actions && response.actions.length > 0) {
        const successfulActions = response.actions.filter(a => a.success);
        if (successfulActions.length > 0) {
          successfulActions.forEach(action => {
            showSuccess(action.message);
          });
          onNotesChanged?.();
        }
      }
    } catch (error) {
      setMessages(prev => prev.filter(m => m.id !== loadingMessage.id));
      const errorMessage = error instanceof Error ? error.message : "Failed to send message";
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const isMobile = useIsMobile();

  return (
    <div
      className={cn(
        "w-full sm:w-[22rem] p-4 rounded-t-2xl sm:rounded-none sm:h-screen max-h-full flex flex-col fixed top-full sm:top-0 left-0 sm:left-full transition-transform z-50 bg-[var(--bg-primary)] border-t sm:border-l border-[var(--border-primary)] shadow-lg",
        isOpen
          ? "-translate-y-full sm:translate-y-0 sm:translate-x-[-100%]"
          : "translate-y-0 sm:translate-x-0"
      )}
    >
      <div className="flex-shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-semibold flex-1">AI Assistant</h2>
          {!isPro && (
            <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 rounded-full">
              Pro Feature
            </span>
          )}
          {messages.length > 0 && (
            <Button
              variant="plain"
              icon={Trash2}
              onClick={handleClearChat}
              className="text-[var(--text-secondary)] hover:text-red-500 ml-2"
              title="Clear chat"
            />
          )}
          <Button
            icon={isMobile ? ChevronsDown : ChevronsRight}
            iconSize="5"
            variant="plain"
            iconClassName="text-blue-500"
            onClick={() => onOpenChange(false)}
          />
        </div>
      </div>

      {!isPro ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <Crown className="w-16 h-16 text-amber-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Upgrade to Pro</h3>
          <p className="text-[var(--text-secondary)] mb-6 max-w-sm">
            AI Assistant is a Pro feature. Upgrade to access intelligent note management,
            statistics, and automated actions.
          </p>
          <Button variant="main" onClick={() => onOpenChange(false)}>
            Learn More
          </Button>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto min-h-0 p-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-[var(--text-secondary)]">
                <Sparkles className="w-12 h-12 mb-4 text-blue-500/50" />
                <h3 className="text-lg font-medium mb-2">How can I help you?</h3>
                <p className="text-sm max-w-sm mb-6">
                  Ask me anything about your notes, get statistics, or let me help you create,
                  archive, star, or organize your notes.
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <SuggestionChip
                    text="📊 Show my note statistics"
                    onClick={() => setInputValue("Show me my note statistics")}
                  />
                  <SuggestionChip
                    text="📝 Create a note"
                    onClick={() => setInputValue("Create a note about ")}
                  />
                  <SuggestionChip
                    text="🔍 Search my notes"
                    onClick={() => setInputValue("Find notes about ")}
                  />
                  <SuggestionChip
                    text="🗑️ Delete my note"
                    onClick={() => setInputValue("Delete my note about ")}
                  />
                </div>
              </div>
            ) : (
              messages.map(message => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.role === "user" ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                      message.role === "user"
                        ? "bg-blue-500 text-white"
                        : "bg-[var(--bg-secondary)]"
                    )}
                  >
                    {message.role === "user" ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </div>
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-2",
                      message.role === "user"
                        ? "bg-blue-500 text-white"
                        : "bg-[var(--bg-secondary)]"
                    )}
                  >
                    {message.isLoading ? (
                      <div className="flex items-center gap-1 py-1">
                        <span className="w-2 h-2 bg-current rounded-full animate-bounce" />
                        <span
                          className="w-2 h-2 bg-current rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        />
                        <span
                          className="w-2 h-2 bg-current rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        />
                      </div>
                    ) : (
                      <>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        {message.actions && message.actions.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-current/10">
                            {message.actions.map((action, idx) => (
                              <div
                                key={idx}
                                className={cn(
                                  "text-xs flex items-center gap-1",
                                  action.success ? "text-green-500" : "text-red-500"
                                )}
                              >
                                {action.success ? "✓" : "✗"} {action.message}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                    <p
                      className={cn(
                        "text-xs mt-1",
                        message.role === "user" ? "text-white/60" : "text-[var(--text-tertiary)]"
                      )}
                    >
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex-shrink-0">
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything..."
                className="flex-1 resize-none rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 min-h-[44px] max-h-[120px]"
                rows={1}
                disabled={isLoading}
              />
              <Button
                variant="main"
                icon={Send}
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="self-end"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SuggestionChip({ text, onClick }: { text: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-2 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] text-left transition-colors"
    >
      {text}
    </button>
  );
}
