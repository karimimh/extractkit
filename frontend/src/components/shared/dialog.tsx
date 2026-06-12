import { X } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type DialogSize = "sm" | "md" | "lg" | "xl";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  size?: DialogSize;
  closeLabel?: string;
  ariaLabel?: string;
};

const ANIMATION_MS = 220;

export function Dialog({
  open,
  onClose,
  children,
  className = "",
  size = "md",
  closeLabel = "Close",
  ariaLabel,
}: DialogProps) {
  const [rendered, setRendered] = useState(open);
  const closeTimer = useRef<number | null>(null);

  useEffect(() => {
    if (open) {
      if (closeTimer.current !== null) {
        window.clearTimeout(closeTimer.current);
        closeTimer.current = null;
      }
      if (!rendered) {
        const frame = window.requestAnimationFrame(() => setRendered(true));
        return () => window.cancelAnimationFrame(frame);
      }
      return;
    }

    if (!rendered) return;
    closeTimer.current = window.setTimeout(() => {
      setRendered(false);
      closeTimer.current = null;
    }, ANIMATION_MS);
    return () => {
      if (closeTimer.current !== null) {
        window.clearTimeout(closeTimer.current);
        closeTimer.current = null;
      }
    };
  }, [open, rendered]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!rendered) return null;

  return createPortal(
    <div
      className={open ? "dialog-backdrop dialog-backdrop-open" : "dialog-backdrop dialog-backdrop-closing"}
      onClick={onClose}
      aria-hidden={!open}
    >
      <div
        className={[
          "dialog-panel",
          `dialog-panel-${size}`,
          open ? "dialog-panel-open" : "dialog-panel-closing",
          className,
        ].filter(Boolean).join(" ")}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="dialog-close" onClick={onClose} aria-label={closeLabel}>
          <X size={18} />
        </button>
        <div className="dialog-scroll">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
