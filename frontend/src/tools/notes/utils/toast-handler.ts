import type { ToastType } from "@notes/ui/toast";

type ToastHandler = (message: string, type?: ToastType, duration?: number) => void;

let globalToastHandler: ToastHandler | null = null;

export const setGlobalToastHandler = (handler: ToastHandler) => {
  globalToastHandler = handler;
};

export const showToast = (message: string, type?: ToastType, duration?: number) => {
  if (globalToastHandler) {
    globalToastHandler(message, type, duration);
  } else {
    console.warn("Toast handler not initialized:", message);
  }
};

export const showError = (message: string, duration?: number) => {
  showToast(message, "error", duration);
};

export const showSuccess = (message: string, duration?: number) => {
  showToast(message, "success", duration);
};

export const showInfo = (message: string, duration?: number) => {
  showToast(message, "info", duration);
};

export const showWarning = (message: string, duration?: number) => {
  showToast(message, "warning", duration);
};
