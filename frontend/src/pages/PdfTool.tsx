import { Minus, MousePointer } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { AuthModal } from "../components/AuthModal";
import { PaymentModal } from "../components/PaymentModal";

type ExportResult = {
  title: string;
  pdf_url: string;
};

type PreviewResponse = {
  title: string;
  html: string;
  base_url: string;
};

type ErrorPayload = {
  detail?: string;
};

type InteractionMode = "cursor" | "select";
type RenderMode = "screen" | "print";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";
const SELECT_MESSAGE = "pdf-picker-select";
const CLEAR_MESSAGE = "pdf-picker-clear";
const MODE_MESSAGE = "pdf-picker-set-mode";

function buildPreviewDocument(rawHtml: string, baseUrl: string, interactionMode: InteractionMode) {
  const parser = new DOMParser();
  const documentNode = parser.parseFromString(rawHtml, "text/html");
  const head = documentNode.head ?? documentNode.createElement("head");

  const baseTag = documentNode.createElement("base");
  baseTag.setAttribute("href", baseUrl);
  head.prepend(baseTag);

  const style = documentNode.createElement("style");
  style.id = "pdf-picker-style";
  style.textContent = `
    .pdf-picker-hover {
      outline: 2px dashed #0f766e !important;
      outline-offset: 2px;
      cursor: crosshair !important;
    }
    .pdf-picker-selected {
      outline: 2px solid #f97316 !important;
      outline-offset: 2px;
      background: rgba(249, 115, 22, 0.12) !important;
    }
  `;
  head.appendChild(style);

  const script = documentNode.createElement("script");
  script.id = "pdf-picker-script";
  script.textContent = `
    (() => {
      // Patch URL constructor for frameworks (like Next.js) that calculate using window.location.href
      // which fails when the iframe is hosted via a blob: or about:srcdoc URL.
      const OriginalURL = window.URL;
      window.URL = function URL(url, base) {
        let activeBase = base;
        if (activeBase && (activeBase.startsWith('blob:') || activeBase.startsWith('about:'))) {
          activeBase = document.baseURI;
        } else if (!activeBase && typeof url === 'string' && url.startsWith('/')) {
          activeBase = document.baseURI;
        }
        try {
          return new OriginalURL(url, activeBase);
        } catch (e) {
          // Fallback to document.baseURI if no base was provided and original threw
          if (!base && document.baseURI) {
            return new OriginalURL(url, document.baseURI);
          }
          throw e;
        }
      };
      
      // Preserve static methods
      window.URL.createObjectURL = OriginalURL.createObjectURL;
      window.URL.revokeObjectURL = OriginalURL.revokeObjectURL;

      window.URL.canParse = OriginalURL.canParse;

      // Patch history.pushState and history.replaceState to prevent cross-origin errors
      // when SPA frameworks try to navigate within the blob: iframe.
      const originalPushState = window.history.pushState;
      const originalReplaceState = window.history.replaceState;
      
      window.history.pushState = function() {
        try {
          return originalPushState.apply(this, arguments);
        } catch (e) {
          console.warn("Ignored pushState error in iframe", e);
        }
      };
      
      window.history.replaceState = function() {
        try {
          return originalReplaceState.apply(this, arguments);
        } catch (e) {
          console.warn("Ignored replaceState error in iframe", e);
        }
      };

      const HOVER = "pdf-picker-hover";
      const SELECTED = "pdf-picker-selected";
      let isSelectMode = ${interactionMode === "select" ? "true" : "false"};

      const isSelectable = (element) => {
        if (!element || !(element instanceof Element)) return false;
        const tag = element.tagName.toLowerCase();
        return !["html", "body", "script", "style", "link", "meta"].includes(tag);
      };

      const cssPath = (element) => {
        if (!element || !(element instanceof Element)) return "";
        if (element.id) {
          return "#" + CSS.escape(element.id);
        }

        const segments = [];
        let current = element;
        while (current && current !== document.body) {
          const tag = current.tagName.toLowerCase();
          let segment = tag;
          const classList = Array.from(current.classList)
            .filter(Boolean)
            .slice(0, 2)
            .map((name) => "." + CSS.escape(name))
            .join("");
          if (classList) {
            segment += classList;
          }
          const parent = current.parentElement;
          if (parent) {
            const siblings = Array.from(parent.children).filter(
              (child) => child.tagName === current.tagName
            );
            if (siblings.length > 1) {
              segment += ":nth-of-type(" + (siblings.indexOf(current) + 1) + ")";
            }
          }
          segments.unshift(segment);
          current = current.parentElement;
        }
        return segments.join(" > ");
      };

      const send = (selector, selected) => {
        window.parent.postMessage(
          { type: "${SELECT_MESSAGE}", selector, selected },
          "*"
        );
      };

      document.addEventListener(
        "mouseover",
        (event) => {
          if (!isSelectMode) return;
          const target = event.target;
          if (!isSelectable(target)) return;
          target.classList.add(HOVER);
        },
        true
      );

      document.addEventListener(
        "mouseout",
        (event) => {
          if (!isSelectMode) return;
          const target = event.target;
          if (!isSelectable(target)) return;
          target.classList.remove(HOVER);
        },
        true
      );

      document.addEventListener(
        "click",
        (event) => {
          if (!isSelectMode) return;
          const target = event.target;
          if (!isSelectable(target)) return;
          event.preventDefault();
          event.stopPropagation();
          const selector = cssPath(target);
          if (!selector) return;
          const selected = target.classList.toggle(SELECTED);
          target.dataset.pdfSelector = selector;
          send(selector, selected);
        },
        true
      );

      window.addEventListener("message", (event) => {
        if (!event.data) return;
        if (event.data.type === "${CLEAR_MESSAGE}") {
          document.querySelectorAll("." + SELECTED).forEach((element) => {
            element.classList.remove(SELECTED);
          });
        }
        if (event.data.type === "${MODE_MESSAGE}") {
          isSelectMode = event.data.mode === "select";
          if (!isSelectMode) {
            document.querySelectorAll("." + HOVER).forEach((element) => {
              element.classList.remove(HOVER);
            });
          }
        }
      });
    })();
  `;
  // Prepend our script so it executes before any of the original website's scripts
  if (head.firstChild) {
    head.insertBefore(script, head.firstChild);
  } else {
    head.appendChild(script);
  }

  if (!documentNode.head) {
    documentNode.documentElement.prepend(head);
  }

  return documentNode.documentElement.outerHTML;
}

function PdfTool() {
  const { token, refreshUser } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [url, setUrl] = useState("");
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewSnapshot, setPreviewSnapshot] = useState<string | null>(null);
  const [previewBaseUrl, setPreviewBaseUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [selections, setSelections] = useState<string[]>([]);
  const [interactionMode, setInteractionMode] = useState<InteractionMode>("select");
  const [renderMode, setRenderMode] = useState<RenderMode>("print");
  const [result, setResult] = useState<ExportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<"generic" | "no_credits" | "anon_limit" | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const previewRequestIdRef = useRef(0);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const payload = event.data as { type?: string; selector?: string; selected?: boolean };
      if (!payload || payload.type !== SELECT_MESSAGE || !payload.selector) {
        return;
      }

      setSelections((current) => {
        if (payload.selected) {
          if (current.includes(payload.selector!)) {
            return current;
          }
          return [...current, payload.selector!];
        }

        return current.filter((selector) => selector !== payload.selector);
      });
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (previewHtml) {
      const blob = new Blob([previewHtml], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      setPreviewBlobUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewBlobUrl(null);
    }
  }, [previewHtml]);

  const loadPreview = async (
    previewUrl: string,
    requestId = ++previewRequestIdRef.current,
  ) => {
    setPreviewError(null);
    setError(null);
    setResult(null);
    setIsPreviewLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/preview/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: previewUrl,
          use_print_css: false,
        }),
      });

      const payload = (await response.json()) as PreviewResponse | ErrorPayload;

      if (requestId !== previewRequestIdRef.current) {
        return;
      }

      if (!response.ok) {
        const detail = (payload as ErrorPayload).detail;
        setPreviewError(detail ?? "Failed to load preview.");
        return;
      }

      const preview = payload as PreviewResponse;
      setPreviewTitle(preview.title);
      setPreviewHtml(buildPreviewDocument(preview.html, preview.base_url, interactionMode));
      setPreviewSnapshot(preview.html);
      setPreviewBaseUrl(preview.base_url);
      setSelections([]);
    } catch {
      if (requestId === previewRequestIdRef.current) {
        setPreviewError("Unable to reach backend. Ensure Django server is running.");
      }
    } finally {
      if (requestId === previewRequestIdRef.current) {
        setIsPreviewLoading(false);
      }
    }
  };

  useEffect(() => {
    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      previewRequestIdRef.current += 1;
      setPreviewError(null);
      setPreviewHtml(null);
      setPreviewSnapshot(null);
      setPreviewBaseUrl(null);
      setPreviewTitle(null);
      setIsPreviewLoading(false);
      setSelections([]);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void loadPreview(trimmedUrl);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [url]);

  const handlePreview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      setPreviewError("Please enter a URL.");
      return;
    }

    void loadPreview(trimmedUrl);
  };

  const clearSelections = () => {
    setSelections([]);
    iframeRef.current?.contentWindow?.postMessage({ type: CLEAR_MESSAGE }, "*");
  };

  const handleUrlChange = (value: string) => {
    setUrl(value);
    setPreviewError(null);
    setSelections([]);
  };

  const handleInteractionModeChange = (nextMode: InteractionMode) => {
    setInteractionMode(nextMode);
    iframeRef.current?.contentWindow?.postMessage({ type: MODE_MESSAGE, mode: nextMode }, "*");
  };

  const handleRenderModeChange = (nextMode: RenderMode) => {
    setRenderMode(nextMode);
  };

  // Handle ?payment=success redirect from NOWPayments
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "success") {
      window.history.replaceState({}, "", window.location.pathname);
      void refreshUser();
    }
  }, [refreshUser]);

  const onSubmit = async () => {
    setError(null);
    setErrorType(null);
    setResult(null);

    if (!url.trim()) {
      setError("Please enter a URL.");
      return;
    }

    setIsLoading(true);

    try {
      const exportPayload: {
        url: string;
        selectors: string[];
        html_snapshot?: string;
        base_url?: string;
        use_print_css: boolean;
      } = {
        url: url.trim(),
        selectors: selections,
        use_print_css: renderMode === "print",
      };

      if (previewSnapshot && previewBaseUrl) {
        let finalSnapshot = previewSnapshot;
        if (iframeRef.current?.contentDocument) {
          const docCopy = iframeRef.current.contentDocument.cloneNode(true) as Document;
          docCopy.getElementById("pdf-picker-style")?.remove();
          docCopy.getElementById("pdf-picker-script")?.remove();

          // Remove all script tags from the snapshot before sending it to the PDF renderer.
          // This prevents client-side frameworks (like Next.js/React) from attempting to 
          // rehydrate on the static DOM within Playwright and crashing the page.
          Array.from(docCopy.getElementsByTagName("script")).forEach(script => script.remove());

          finalSnapshot = docCopy.documentElement.outerHTML;
        }

        exportPayload.html_snapshot = finalSnapshot;
        exportPayload.base_url = previewBaseUrl;
      }

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch(`${API_BASE_URL}/api/export/`, {
        method: "POST",
        headers,
        body: JSON.stringify(exportPayload),
      });

      const payload = (await response.json()) as ExportResult | ErrorPayload;

      if (!response.ok) {
        const detail = (payload as ErrorPayload).detail;
        if (response.status === 402) {
          setErrorType("no_credits");
          setError(detail ?? "No download credits remaining.");
        } else if (response.status === 403) {
          setErrorType("anon_limit");
          setError(detail ?? "Free download limit reached.");
        } else {
          setErrorType("generic");
          setError(detail ?? "Failed to export PDF.");
        }
        return;
      }

      setResult(payload as ExportResult);
      void refreshUser();
    } catch {
      setError("Unable to reach backend. Ensure Django server is running.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <header className="card-header">
          <h1>Export Any Webpage to a Custom PDF</h1>
          <h2 className="subtitle">Interact with the page, remove what you don't want, export exactly what you do</h2>
          <div className="seo-tags">
            {["custom pdf from webpage", "remove elements from pdf", "clean webpage to pdf", "export website without ads", "web to pdf converter", "html to pdf", "save webpage as pdf"].map((tag) => (
              <span className="seo-tag" key={tag}>{tag}</span>
            ))}
          </div>
          <p className="subtitle">
            Paste a URL and get a live, interactive preview of the page. Click buttons, expand sections, and navigate — just like a real browser. Then switch to Remove mode and click any element (ads, cookie banners, sidebars, headers) to strip it out. Export the final result as a pixel-perfect PDF.
          </p>
        </header>

        <div className="card-grid" style={{ marginTop: "1.9rem" }}>
          <div className="control-stack">
            <form onSubmit={handlePreview} className="export-form">
              <label htmlFor="url">Website URL</label>
              <div className="url-row">
                <input
                  id="url"
                  type="url"
                  placeholder="https://example.com/pricing"
                  value={url}
                  onChange={(event) => handleUrlChange(event.target.value)}
                  required
                />
              </div>
            </form>

            {previewError && <p className="message error">{previewError}</p>}

            <div className="preview-shell">
              {previewBlobUrl ? (
                <div className="preview-panel">
                  <div className="preview-head">
                    <div className="preview-head-left">
                      <h2>{previewTitle ?? "Preview"}</h2>
                      <p>Click to remove elements.</p>
                    </div>
                    <div className="toggle-buttons">
                      <button
                        type="button"
                        className={interactionMode === "select" ? "active flex-button" : "flex-button"}
                        onClick={() => handleInteractionModeChange("select")}
                        style={{ display: "flex", alignItems: "center", gap: "6px" }}
                      >
                        <Minus size={16} /> Remove elements
                      </button>
                      <button
                        type="button"
                        className={interactionMode === "cursor" ? "active flex-button" : "flex-button"}
                        onClick={() => handleInteractionModeChange("cursor")}
                        style={{ display: "flex", alignItems: "center", gap: "6px" }}
                      >
                        <MousePointer size={16} /> Browse page
                      </button>
                    </div>
                  </div>
                  <iframe
                    ref={iframeRef}
                    title="Preview"
                    className="preview-frame"
                    src={previewBlobUrl}
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  />
                </div>
              ) : isPreviewLoading ? (
                <div className="preview-panel">
                  <div className="loading-container">
                    <div className="loading-spinner" />
                    <div className="loading-text">
                      <h3>Loading Preview</h3>
                      <p>Fetching and processing your page...</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="preview-empty">
                  <p>Load a page to start interacting or remove elements from the webpage.</p>
                </div>
              )}
            </div>

            <div className="selection-list">
              <div className="flex items-center justify-between">
                <div>Removed elements</div>
                <div className="selection-info">
                  <div>{selections.length} removed</div>
                  <button type="button" className="ghost" onClick={clearSelections}>
                    Clear
                  </button>
                </div>
              </div>
              {selections.length ? (
                <div className="chips">
                  {selections.map((selector) => (
                    <span className="chip" key={selector}>
                      {selector}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="empty">No selections yet.</span>
              )}
            </div>

            <div className="toggle-group">
              <span>Layout mode</span>
              <div className="toggle-buttons">
                <button
                  type="button"
                  className={renderMode === "screen" ? "active" : ""}
                  onClick={() => handleRenderModeChange("screen")}
                >
                  Screen
                </button>
                <button
                  type="button"
                  className={renderMode === "print" ? "active" : ""}
                  onClick={() => handleRenderModeChange("print")}
                >
                  Print
                </button>
              </div>
            </div>

            <div className="export-actions">
              <button type="button" onClick={onSubmit} disabled={isLoading} className={isLoading ? "export-loading" : ""}>
                {isLoading ? "Generating PDF..." : "Export PDF"}
              </button>
            </div>

            {error && (
              <div className="message error">
                <span>{error}</span>
                {errorType === "no_credits" && (
                  <button type="button" className="inline-action" onClick={() => setShowPaymentModal(true)}>
                    Buy Credits
                  </button>
                )}
                {errorType === "anon_limit" && (
                  <button type="button" className="inline-action" onClick={() => setShowAuthModal(true)}>
                    Sign In
                  </button>
                )}
              </div>
            )}

            {result && (
              <div className="result-panel">
                <h2>{result.title}</h2>
                <p>Your PDF is ready.</p>
                <a href={result.pdf_url} target="_blank" rel="noreferrer">
                  Download PDF
                </a>
              </div>
            )}

          </div>


        </div>

        <footer className="support-footer">
          Need help? Email us at{" "}
          <a href="mailto:distillpage@gmail.com">distillpage@gmail.com</a>
        </footer>
      </div>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      {showPaymentModal && <PaymentModal onClose={() => setShowPaymentModal(false)} />}
    </main>
  );
}

export default PdfTool;
