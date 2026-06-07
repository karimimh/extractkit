import { cn } from "@notes/utils/css-utils";
import { type ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface GlassDialogProps {
  children?: ReactNode;
  className?: string;
  isOpen: boolean;
  onClose: () => void;
}

const GlassDialog = ({ isOpen, onClose, children, className = "" }: GlassDialogProps) => {
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowDialog(isOpen);
    } else {
      const timer = setTimeout(() => {
        setShowDialog(isOpen);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  return showDialog ? (
    createPortal(
      <div
        className="fixed top-0 left-0 w-full h-full flex items-center justify-center z-50"
        onClick={onClose}
      >
        <div
          className={cn(
            `backdrop-blur-lg bg-white/5 border border-white/20 overflow-hidden rounded-md ${
              isOpen
                ? "animate-[scale-in_150ms_cubic-bezier(0.4,0,0.6,1)_forwards] scale-100"
                : "animate-[scale-out_150ms_cubic-bezier(0.4,0,0.6,1)_forwards] scale-95"
            }`,
            className
          )}
          onClick={e => e.stopPropagation()}
        >
          {children}
        </div>
      </div>,
      document.body
    )
  ) : (
    <></>
  );
};

export default GlassDialog;
