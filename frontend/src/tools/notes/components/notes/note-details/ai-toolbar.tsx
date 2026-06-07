import React from "react";
import { Sparkles } from "lucide-react";
import Button from "@notes/ui/button";

interface AIToolbarProps {
  onOpenSidebar: () => void;
  bgColor?: string;
  textColor?: string;
}

const AIToolbar: React.FC<AIToolbarProps> = ({ onOpenSidebar, bgColor, textColor }) => {
  return (
    <div
      className="absolute top-16 right-3 rounded-md bg-[var(--bg-secondary)] shadow-md"
      style={{
        backgroundColor: bgColor,
        color: textColor,
      }}
    >
      <div className="flex items-center gap-2">
        <Button
          onClick={onOpenSidebar}
          className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md cursor-pointer"
          title="Open AI Assistant"
          icon={Sparkles}
          iconSize="4"
        />
      </div>
    </div>
  );
};

export default AIToolbar;
