import { useEffect } from "react";

interface UseDialogScrollLockOptions {
  isOpen: boolean;
  onClose: () => void;
  checkPopover?: boolean;
}

export function useDialogScrollLock({
  isOpen,
  onClose,
  checkPopover = true,
}: UseDialogScrollLockOptions) {
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      const preventBackgroundScroll = (e: Event) => {
        const target = e.target as Element;
        if (target && !target.closest('[role="dialog"]')) {
          e.preventDefault();
          e.stopPropagation();
        }
      };

      const handleEscapeKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          if (checkPopover) {
            const isPopoverOpen = document.querySelector('[data-type="popover-content"]');
            if (isPopoverOpen) {
              return;
            }
          }
          onClose();
        }
      };

      document.addEventListener("wheel", preventBackgroundScroll, { passive: false });
      document.addEventListener("touchmove", preventBackgroundScroll, { passive: false });
      document.addEventListener("keydown", handleEscapeKey);

      return () => {
        document.body.style.overflow = originalOverflow;
        document.removeEventListener("wheel", preventBackgroundScroll);
        document.removeEventListener("touchmove", preventBackgroundScroll);
        document.removeEventListener("keydown", handleEscapeKey);
      };
    }
  }, [isOpen, onClose, checkPopover]);
}
