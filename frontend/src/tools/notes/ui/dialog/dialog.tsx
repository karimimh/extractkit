import { cn } from "@notes/utils/css-utils";
import React, { type ReactNode, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import useControllableState from "../../hooks/use-controllable-state";
import DialogContent, {
  type DialogContentComp,
  type DialogContentProps,
} from "./dialog-content/dialog-content";
import DialogTrigger, { type DialogTriggerComp, type DialogTriggerProps } from "./dialog-trigger";

interface DialogProps {
  children?: ReactNode;
  backdropClassName?: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  mobileVariant?: "drawer" | "fullscreen" | "modal";
}

interface DialogComp extends React.FC<DialogProps> {
  Trigger: DialogTriggerComp;
  Content: DialogContentComp;
  ExtraControls: React.FC<React.HTMLAttributes<HTMLDivElement>>;
}

const Dialog: DialogComp = ({
  isOpen: controlledIsOpen,
  onOpenChange: controlledOnOpenChange,
  children,
  backdropClassName,
  mobileVariant = "drawer",
}: DialogProps) => {
  const [isOpen, onOpenChange] = useControllableState(
    controlledIsOpen,
    controlledOnOpenChange,
    false
  );

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

  // Prevent body scroll and touch events when dialog is open
  useEffect(() => {
    if (isOpen) {
      // Store original body overflow
      const originalOverflow = document.body.style.overflow;

      // Prevent scrolling on body
      document.body.style.overflow = "hidden";

      // More targeted scroll prevention - only prevent scrolling on elements outside dialog
      const preventBackgroundScroll = (e: Event) => {
        const target = e.target as Element;
        // Only prevent if the scroll target is not within a dialog content
        if (target && !target.closest('[role="dialog"], .dialog-content')) {
          e.preventDefault();
          e.stopPropagation();
        }
      };

      // Add event listeners to prevent background scrolling
      document.addEventListener("wheel", preventBackgroundScroll, { passive: false });
      document.addEventListener("touchmove", preventBackgroundScroll, { passive: false });

      // Prevent keyboard scrolling on document level
      const preventKeyboardScroll = (e: KeyboardEvent) => {
        const target = e.target as Element;
        // Close dialog on Escape key
        if (e.key === "Escape") {
          onOpenChange(false);
          return;
        }
        // Only prevent if focus is not within dialog content
        if (target && !target.closest('[role="dialog"], .dialog-content')) {
          if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(e.key)) {
            e.preventDefault();
          }
        }
      };

      document.addEventListener("keydown", preventKeyboardScroll);

      return () => {
        // Restore original body overflow
        document.body.style.overflow = originalOverflow;

        // Remove event listeners
        document.removeEventListener("wheel", preventBackgroundScroll);
        document.removeEventListener("touchmove", preventBackgroundScroll);
        document.removeEventListener("keydown", preventKeyboardScroll);
      };
    }
  }, [isOpen]);

  const trigger = useMemo(() => {
    return React.Children.map(children, child => {
      if (!React.isValidElement(child) || child.type === "string") return null;

      if (child.type !== DialogTrigger) return null;
      return React.cloneElement(child as React.ReactElement<DialogTriggerProps>, {
        onClick: () => onOpenChange(true),
      });
    })
      ?.filter(child => Boolean(child))
      .at(0);
  }, [children, onOpenChange]);

  const content = useMemo(() => {
    return React.Children.map(children, child => {
      if (!React.isValidElement(child) || child.type === "string") return null;

      if (child.type !== DialogContent) return null;
      return React.cloneElement(child as React.ReactElement<DialogContentProps>, {
        onClick: () => onOpenChange(true),
        isOpen,
        onOpenChange,
        mobileVariant,
      });
    })
      ?.filter(child => Boolean(child))
      .at(0);
  }, [children, isOpen, onOpenChange, mobileVariant]);

  return (
    <>
      {trigger}
      {showDialog
        ? createPortal(
            <div
              className={cn(
                `fixed top-0 left-0 w-full h-screen flex items-center justify-center z-50 bg-black/20 ${
                  isOpen ? "animate-show" : "animate-hide"
                }`,
                backdropClassName
              )}
              onClick={() => onOpenChange(false)}
              style={{ touchAction: "none" }}
            >
              {content}
            </div>,
            document.body
          )
        : null}
    </>
  );
};

Dialog.Trigger = DialogTrigger;
Dialog.Content = DialogContent;
Dialog.ExtraControls = DialogContent.ExtraControls;

export default Dialog;
