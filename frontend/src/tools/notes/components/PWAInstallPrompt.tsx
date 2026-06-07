import { useEffect, useState } from "react";

// PWA service-worker registration is provided by note-cards' standalone build.
// In the unified DistillPage app there is no vite-plugin-pwa, so this is a no-op.
function useRegisterSW(_options?: unknown): {
  needRefresh: [boolean, (v: boolean) => void];
  updateServiceWorker: (reload?: boolean) => Promise<void>;
} {
  const needRefreshState = useState(false);
  return {
    needRefresh: needRefreshState,
    updateServiceWorker: async () => {},
  };
}

export function PWAInstallPrompt() {
  const [showInstall, setShowInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      console.log(`Service Worker registered: ${swUrl}`);
      if (r) {
        setInterval(() => {
          r.update();
        }, 60 * 60 * 1000); // Check for updates every hour
      }
    },
    onRegisterError(error) {
      console.error("SW registration error", error);
    },
  });

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    console.log(`User response to install prompt: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstall(false);
  };

  const handleUpdate = () => {
    updateServiceWorker(true);
  };

  if (needRefresh) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium">New version available!</p>
          <div className="flex gap-2">
            <button
              onClick={handleUpdate}
              className="flex-1 bg-white text-blue-600 px-4 py-2 rounded font-medium hover:bg-gray-100 transition-colors"
            >
              Update
            </button>
            <button
              onClick={() => setNeedRefresh(false)}
              className="px-4 py-2 rounded font-medium hover:bg-blue-700 transition-colors"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showInstall) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium">Install NoteMD for quick access!</p>
          <div className="flex gap-2">
            <button
              onClick={handleInstall}
              className="flex-1 bg-white text-blue-600 px-4 py-2 rounded font-medium hover:bg-gray-100 transition-colors"
            >
              Install
            </button>
            <button
              onClick={() => setShowInstall(false)}
              className="px-4 py-2 rounded font-medium hover:bg-blue-700 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
