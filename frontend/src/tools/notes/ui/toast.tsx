import { cn } from "@notes/utils/css-utils";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastProps {
  id: string;
  message: string;
  type?: ToastType;
  duration?: number;
  onClose?: (id: string) => void;
}

export function Toast({ id, message, type = "info", duration = 5000, onClose }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onClose?.(id);
    }, 300);
  }, [id, onClose]);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, handleClose]);

  const icons = {
    success: <CheckCircle className="size-5 shrink-0" />,
    error: <AlertCircle className="size-5 shrink-0" />,
    info: <Info className="size-5 shrink-0" />,
    warning: <AlertTriangle className="size-5 shrink-0" />,
  };

  const styles = {
    success: "bg-emerald-green",
    error: "bg-red-500",
    info: "bg-crayola-blue",
    warning: "bg-gold",
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg transition-all duration-300 min-w-80 max-w-md",
        styles[type],
        isExiting
          ? "animate-out slide-out-to-right-full opacity-0"
          : "animate-in slide-in-from-right-full"
      )}
    >
      {icons[type]}
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={handleClose}
        className="shrink-0 rounded-sm opacity-70 transition-opacity hover:opacity-100"
        aria-label="Close toast"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

export interface ToastContainerProps {
  toasts: ToastProps[];
  onClose: (id: string) => void;
  position?:
    | "top-right"
    | "top-left"
    | "bottom-right"
    | "bottom-left"
    | "top-center"
    | "bottom-center";
}

export function ToastContainer({
  toasts,
  onClose,
  position = "bottom-right",
}: ToastContainerProps) {
  const positionStyles = {
    "top-right": "top-4 right-4 items-end",
    "top-left": "top-4 left-4 items-start",
    "bottom-right": "bottom-4 right-4 items-end",
    "bottom-left": "bottom-4 left-4 items-start",
    "top-center": "top-4 left-1/2 -translate-x-1/2 items-center",
    "bottom-center": "bottom-4 left-1/2 -translate-x-1/2 items-center",
  };

  return createPortal(
    <div className={cn("z-[9999] fixed flex flex-col gap-2", positionStyles[position])}>
      {toasts.map(toast => (
        <Toast key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>,
    document.body
  );
}
