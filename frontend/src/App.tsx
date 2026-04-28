import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";

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

type SelectionMode = "include" | "exclude";
type RenderMode = "screen" | "print";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";
const SELECT_MESSAGE = "pdf-picker-select";
const CLEAR_MESSAGE = "pdf-picker-clear";

function buildPreviewDocument(rawHtml: string, baseUrl: string) {
  const parser = new DOMParser();
  const documentNode = parser.parseFromString(rawHtml, "text/html");
  const head = documentNode.head ?? documentNode.createElement("head");

  const baseTag = documentNode.createElement("base");
  baseTag.setAttribute("href", baseUrl);
  head.prepend(baseTag);

  const style = documentNode.createElement("style");
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
  script.textContent = `
    (() => {
      const HOVER = "pdf-picker-hover";
      const SELECTED = "pdf-picker-selected";

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
          const target = event.target;
          if (!isSelectable(target)) return;
          target.classList.add(HOVER);
        },
        true
      );

      document.addEventListener(
        "mouseout",
        (event) => {
          const target = event.target;
          if (!isSelectable(target)) return;
          target.classList.remove(HOVER);
        },
        true
      );

      document.addEventListener(
        "click",
        (event) => {
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
        if (!event.data || event.data.type !== "${CLEAR_MESSAGE}") return;
        document.querySelectorAll("." + SELECTED).forEach((element) => {
          element.classList.remove(SELECTED);
        });
      });
    })();
  `;
  head.appendChild(script);

  if (!documentNode.head) {
    documentNode.documentElement.prepend(head);
  }

  return documentNode.documentElement.outerHTML;
}

function App() {
  const [url, setUrl] = useState("");
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewSnapshot, setPreviewSnapshot] = useState<string | null>(null);
  const [previewBaseUrl, setPreviewBaseUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [selections, setSelections] = useState<string[]>([]);
  const [mode, setMode] = useState<SelectionMode>("exclude");
  const [renderMode, setRenderMode] = useState<RenderMode>("print");
  const [result, setResult] = useState<ExportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const docsUrl = useMemo(() => `${API_BASE_URL}/api/docs/`, []);

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

  const handlePreview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPreviewError(null);
    setError(null);
    setResult(null);

    if (!url.trim()) {
      setPreviewError("Please enter a URL.");
      return;
    }

    setIsPreviewLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/preview/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: url.trim(),
          use_print_css: renderMode === "print",
        }),
      });

      const payload = (await response.json()) as PreviewResponse | ErrorPayload;

      if (!response.ok) {
        const detail = (payload as ErrorPayload).detail;
        setPreviewError(detail ?? "Failed to load preview.");
        return;
      }

      const preview = payload as PreviewResponse;
      setPreviewTitle(preview.title);
      setPreviewHtml(buildPreviewDocument(preview.html, preview.base_url));
      setPreviewSnapshot(preview.html);
      setPreviewBaseUrl(preview.base_url);
      setSelections([]);
    } catch {
      setPreviewError("Unable to reach backend. Ensure Django server is running.");
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const clearSelections = () => {
    setSelections([]);
    iframeRef.current?.contentWindow?.postMessage({ type: CLEAR_MESSAGE }, "*");
  };

  const handleUrlChange = (value: string) => {
    setUrl(value);
    setPreviewHtml(null);
    setPreviewSnapshot(null);
    setPreviewBaseUrl(null);
    setPreviewTitle(null);
    setSelections([]);
  };

  const handleRenderModeChange = (nextMode: RenderMode) => {
    setRenderMode(nextMode);
    setPreviewHtml(null);
    setPreviewSnapshot(null);
    setPreviewBaseUrl(null);
    setPreviewTitle(null);
    setSelections([]);
  };

  const onSubmit = async () => {
    setError(null);
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
        mode: SelectionMode;
        html_snapshot?: string;
        base_url?: string;
        use_print_css: boolean;
      } = {
        url: url.trim(),
        selectors: selections,
        mode,
        use_print_css: renderMode === "print",
      };

      if (previewSnapshot && previewBaseUrl) {
        exportPayload.html_snapshot = previewSnapshot;
        exportPayload.base_url = previewBaseUrl;
      }

      const response = await fetch(`${API_BASE_URL}/api/export/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(exportPayload),
      });

      const payload = (await response.json()) as ExportResult | ErrorPayload;

      if (!response.ok) {
        const detail = (payload as ErrorPayload).detail;
        setError(detail ?? "Failed to export PDF.");
        return;
      }

      setResult(payload as ExportResult);
    } catch {
      setError("Unable to reach backend. Ensure Django server is running.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="page-shell">
      <div className="grain-layer" />
      <section className="export-card">
        <header className="card-header">
          <p className="eyebrow">Custom PDF Builder</p>
          <h1>Click exactly what should appear in the PDF</h1>
          <p className="subtitle">
            Load a page, tap the sections you want, and export a tailored PDF preview
            before you download.
          </p>
        </header>

        <div className="card-grid">
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
                <button type="submit" disabled={isPreviewLoading} className="secondary">
                  {isPreviewLoading ? "Loading..." : "Load preview"}
                </button>
              </div>
            </form>

            {previewError && <p className="message error">{previewError}</p>}

            <div className="toolbar">
              <div className="toggle-group">
                <span>Selection mode</span>
                <div className="toggle-buttons">
                  <button
                    type="button"
                    className={mode === "include" ? "active" : ""}
                    onClick={() => setMode("include")}
                  >
                    Include
                  </button>
                  <button
                    type="button"
                    className={mode === "exclude" ? "active" : ""}
                    onClick={() => setMode("exclude")}
                  >
                    Exclude
                  </button>
                </div>
              </div>
              <div className="toggle-group">
                <span>Render as</span>
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
              <div className="selection-info">
                <p>{selections.length} selected</p>
                <button type="button" className="ghost" onClick={clearSelections}>
                  Clear
                </button>
              </div>
            </div>

            <div className="selection-list">
              <p>Selected selectors</p>
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

            <div className="export-actions">
              <button type="button" onClick={onSubmit} disabled={isLoading}>
                {isLoading ? "Generating PDF..." : "Export PDF"}
              </button>
            </div>

            {error && <p className="message error">{error}</p>}

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

          <div className="preview-shell">
            {previewHtml ? (
              <div className="preview-panel">
                <div className="preview-head">
                  <h2>{previewTitle ?? "Preview"}</h2>
                  <p>Click to {mode === "include" ? "include" : "exclude"} sections.</p>
                </div>
                <iframe
                  ref={iframeRef}
                  title="Preview"
                  className="preview-frame"
                  srcDoc={previewHtml}
                />
              </div>
            ) : (
              <div className="preview-empty">
                <p>Load a page to start selecting elements.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;
