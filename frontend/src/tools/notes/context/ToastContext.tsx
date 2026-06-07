import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { ToastContainer, type ToastProps } from "@notes/ui/toast";
import { setGlobalToastHandler } from "@notes/utils/toast-handler";

interface ToastContextType {
  showToast: (message: string, type?: ToastProps["type"], duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const showToast = useCallback(
    (message: string, type: ToastProps["type"] = "info", duration = 5000) => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      const newToast: ToastProps = {
        id,
        message,
        type,
        duration,
      };

      setToasts(prev => [...prev, newToast]);
    },
    []
  );

  useEffect(() => {
    setGlobalToastHandler(showToast);
  }, [showToast]);

  const showError = useCallback(
    (message: string, duration = 5000) => {
      showToast(message, "error", duration);
    },
    [showToast]
  );

  const showSuccess = useCallback(
    (message: string, duration = 5000) => {
      showToast(message, "success", duration);
    },
    [showToast]
  );

  const showInfo = useCallback(
    (message: string, duration = 5000) => {
      showToast(message, "info", duration);
    },
    [showToast]
  );

  const showWarning = useCallback(
    (message: string, duration = 5000) => {
      showToast(message, "warning", duration);
    },
    [showToast]
  );

  const handleClose = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, showError, showSuccess, showInfo, showWarning }}>
      {children}
      <ToastContainer toasts={toasts} onClose={handleClose} position="top-right" />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
