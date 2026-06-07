"use client";

import { AIAssistant } from "./ai-assistant";

interface AiAssistantMobileProps {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  onNotesChanged?: () => void;
}

const AiAssistantMobile = ({ onOpenChange, open, onNotesChanged }: AiAssistantMobileProps) => {
  return (
    // FAB for mobile devices
    <div className="sm:hidden">
      <AIAssistant onOpenChange={onOpenChange} isOpen={open} onNotesChanged={onNotesChanged} />
    </div>
  );
};

export default AiAssistantMobile;
