"use client";

import Button from "@notes/ui/button";
import { cn } from "@notes/utils/css-utils";
import { Sparkles } from "lucide-react";

interface AiAssistantButtonProps {
  isMobile: boolean;
  aiAssistantOpen: boolean;
  setAiAssistantOpen: (open: boolean) => void;
}

const AiAssistantButton = ({
  isMobile,
  aiAssistantOpen,
  setAiAssistantOpen,
}: AiAssistantButtonProps) => {
  return (
    <Button
      className={
        isMobile
          ? "fixed bottom-6 right-6 z-50 size-14 rounded-full bg-blue-200 shadow-lg hover:bg-blue-700 transition-all hover:shadow-xl flex items-center justify-center"
          : "apple-ai-button rounded-xl px-2 py-1 transition-all w-fit flex items-center gap-2 relative"
      }
      onClick={() => setAiAssistantOpen(!aiAssistantOpen)}
      variant="plain"
    >
      <div className="transition-all flex items-center justify-center size-7 rounded-lg relative z-10">
        <Sparkles className={cn("size-5", isMobile ? "text-black" : "text-purple-600")} />
      </div>
      {!isMobile && (
        <span className="text-sm font-medium bg-gradient-to-r from-purple-600 to-violet-600 dark:from-purple-400 dark:to-violet-400 bg-clip-text text-transparent relative z-10">
          Ask AI Assistant...
        </span>
      )}
    </Button>
  );
};

export default AiAssistantButton;
