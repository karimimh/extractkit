import { Check, Copy, Download, Minus, MousePointer } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { AuthModal } from "../components/auth-modal";
import { BulkUrlInput } from "../components/bulk-url-input";
import { DomainPageDiscovery } from "../components/domain-page-discovery";
import { ExportActivity } from "../components/export-activity";
import { PaymentModal } from "../components/payment-modal";
import { Switch } from "../components/shared/switch";
import { useAuth } from "../context/auth-context";
import { usePageSeo } from "../hooks/use-page-seo";
import { formatUsd, PRICE_PER_ACTION_CENTS } from "../lib/billing";
import { runExportJob } from "../lib/export-jobs";

const JSON_TOOL_SEO = {
  title: "Website to JSON Converter – ExtractKit",
  description:
    "Extract standard webpage fields or use custom instructions and an optional JSON Schema to create structured JSON.",
  canonical: "https://extractkit.io/web-to-json",
  jsonLd: {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Website to JSON Converter – ExtractKit",
    url: "https://extractkit.io/web-to-json",
    description:
      "Extract standard webpage fields or create custom structured JSON using instructions and an optional JSON Schema.",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  },
};

type StructuredJson = {
  source_url: string;
  title: string;
  author: string;
  date: string;
  headings: { level: number; text: string }[];
  paragraphs: string[];
  content: string;
  tables: { caption: string; headers: string[]; rows: string[][] }[];
  images: { src: string; alt: string; title: string; width: string; height: string }[];
  links: { href: string; text: string; title: string }[];
  metadata: Record<string, unknown>;
};

type ExportResult = {
  title: string;
  data: StructuredJson | Record<string, unknown>;
};

type BulkExportResult = {
  title: string;
  file_url: string;
  file_ext: string;
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
type ToolMode = "single" | "bulk" | "domain";
type BulkOutputMode = "zip" | "combined";
type CleanupMode = "full" | "ai" | "manual";
type ExtractionMode = "standard" | "custom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";
const SELECT_MESSAGE = "json-picker-select";
const CLEAR_MESSAGE = "json-picker-clear";
const MODE_MESSAGE = "json-picker-set-mode";

function buildPreviewDocument(rawHtml: string, baseUrl: string, interactionMode: InteractionMode) {
  const parser = new DOMParser();
  const documentNode = parser.parseFromString(rawHtml, "text/html");
  const head = documentNode.head ?? documentNode.createElement("head");

  const baseTag = documentNode.createElement("base");
  baseTag.setAttribute("href", baseUrl);
  head.prepend(baseTag);

  const style = documentNode.createElement("style");
  style.id = "json-picker-style";
  style.textContent = `
    .json-picker-hover {
      outline: 2px dashed #0f766e !important;
      outline-offset: 2px;
      cursor: crosshair !important;
    }
    .json-picker-selected {
      outline: 2px solid #f97316 !important;
      outline-offset: 2px;
      background: rgba(249, 115, 22, 0.12) !important;
    }
  `;
  head.appendChild(style);

  const script = documentNode.createElement("script");
  script.id = "json-picker-script";
  script.textContent = `
    (() => {
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
          if (!base && document.baseURI) return new OriginalURL(url, document.baseURI);
          throw e;
        }
      };
      window.URL.createObjectURL = OriginalURL.createObjectURL;
      window.URL.revokeObjectURL = OriginalURL.revokeObjectURL;
      window.URL.canParse = OriginalURL.canParse;

      const originalPushState = window.history.pushState;
      const originalReplaceState = window.history.replaceState;
      window.history.pushState = function() {
        try { return originalPushState.apply(this, arguments); } catch (e) {}
      };
      window.history.replaceState = function() {
        try { return originalReplaceState.apply(this, arguments); } catch (e) {}
      };

      const HOVER = "json-picker-hover";
      const SELECTED = "json-picker-selected";
      let isSelectMode = ${interactionMode === "select" ? "true" : "false"};

      const isSelectable = (element) => {
        if (!element || !(element instanceof Element)) return false;
        const tag = element.tagName.toLowerCase();
        return !["html", "body", "script", "style", "link", "meta"].includes(tag);
      };

      const cssPath = (element) => {
        if (!element || !(element instanceof Element)) return "";
        if (element.id) return "#" + CSS.escape(element.id);
        const segments = [];
        let current = element;
        while (current && current !== document.body) {
          const tag = current.tagName.toLowerCase();
          let segment = tag;
          const classList = Array.from(current.classList)
            .filter(Boolean).slice(0, 2)
            .map((name) => "." + CSS.escape(name)).join("");
          if (classList) segment += classList;
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
        window.parent.postMessage({ type: "${SELECT_MESSAGE}", selector, selected }, "*");
      };

      document.addEventListener("mouseover", (event) => {
        if (!isSelectMode) return;
        const target = event.target;
        if (!isSelectable(target)) return;
        target.classList.add(HOVER);
      }, true);

      document.addEventListener("mouseout", (event) => {
        if (!isSelectMode) return;
        const target = event.target;
        if (!isSelectable(target)) return;
        target.classList.remove(HOVER);
      }, true);

      document.addEventListener("click", (event) => {
        if (!isSelectMode) return;
        const target = event.target;
        if (!isSelectable(target)) return;
        event.preventDefault();
        event.stopPropagation();
        const selector = cssPath(target);
        if (!selector) return;
        const selected = target.classList.toggle(SELECTED);
        send(selector, selected);
      }, true);

      window.addEventListener("message", (event) => {
        if (!event.data) return;
        if (event.data.type === "${CLEAR_MESSAGE}") {
          document.querySelectorAll("." + SELECTED).forEach((el) => el.classList.remove(SELECTED));
        }
        if (event.data.type === "${MODE_MESSAGE}") {
          isSelectMode = event.data.mode === "select";
          if (!isSelectMode) {
            document.querySelectorAll("." + HOVER).forEach((el) => el.classList.remove(HOVER));
          }
        }
      });
    })();
  `;
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

function WebsiteToJson() {
  usePageSeo(JSON_TOOL_SEO);
  const { user, token, refreshUser } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [toolMode, setToolMode] = useState<ToolMode>("single");
  const [url, setUrl] = useState("");
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewSnapshot, setPreviewSnapshot] = useState<string | null>(null);
  const [previewBaseUrl, setPreviewBaseUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [selections, setSelections] = useState<string[]>([]);
  const [cleanupMode, setCleanupMode] = useState<CleanupMode>("manual");
  const [extractionMode, setExtractionMode] = useState<ExtractionMode>("standard");
  const [extractionPrompt, setExtractionPrompt] = useState("");
  const [jsonSchema, setJsonSchema] = useState("");
  const [interactionMode, setInteractionMode] = useState<InteractionMode>("select");
  const [result, setResult] = useState<ExportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<"generic" | "no_credits" | "anon_limit" | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [bulkUrls, setBulkUrls] = useState("");
  const [domainUrls, setDomainUrls] = useState("");
  const [bulkOutputMode, setBulkOutputMode] = useState<BulkOutputMode>("combined");
  const [bulkAiCleanup, setBulkAiCleanup] = useState(false);
  const [bulkResult, setBulkResult] = useState<BulkExportResult | null>(null);
  const [domainPagesDiscovered, setDomainPagesDiscovered] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const previewRequestIdRef = useRef(0);

  const formattedJson = result ? JSON.stringify(result.data, null, 2) : "";
  const validBulkUrls = (toolMode === "domain" ? domainUrls : bulkUrls).split("\n").map((bulkUrl) => bulkUrl.trim()).filter(Boolean);
  const totalCostCents = validBulkUrls.length * PRICE_PER_ACTION_CENTS;
  const hasEnoughBalance = !user || user.balance_cents >= totalCostCents;

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const payload = event.data as { type?: string; selector?: string; selected?: boolean };
      if (!payload || payload.type !== SELECT_MESSAGE || !payload.selector) return;
      setSelections((current) => {
        if (payload.selected) {
          if (current.includes(payload.selector!)) return current;
          return [...current, payload.selector!];
        }
        return current.filter((selector) => selector !== payload.selector);
      });
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => {
    if (!previewHtml) {
      setPreviewBlobUrl(null);
      return;
    }
    const blob = new Blob([previewHtml], { type: "text/html" });
    const blobUrl = URL.createObjectURL(blob);
    setPreviewBlobUrl(blobUrl);
    return () => URL.revokeObjectURL(blobUrl);
  }, [previewHtml]);

  const loadPreview = async (previewUrl: string, requestId = ++previewRequestIdRef.current) => {
    setPreviewError(null);
    setError(null);
    setResult(null);
    setIsPreviewLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/preview/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: previewUrl, use_print_css: false }),
      });

      const payload = (await response.json()) as PreviewResponse | ErrorPayload;

      if (requestId !== previewRequestIdRef.current) return;

      if (!response.ok) {
        setPreviewError((payload as ErrorPayload).detail ?? "Failed to load preview.");
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
    if (extractionMode === "custom" || cleanupMode !== "manual" || !trimmedUrl) {
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
    const timeoutId = window.setTimeout(() => void loadPreview(trimmedUrl), 300);
    return () => window.clearTimeout(timeoutId);
  }, [url, cleanupMode, extractionMode]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "success") {
      window.history.replaceState({}, "", window.location.pathname);
      void refreshUser();
    }
  }, [refreshUser]);

  const handlePreview = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedUrl = url.trim();
    if (extractionMode === "custom" || cleanupMode !== "manual") return;
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

  const handleInteractionModeChange = (nextMode: InteractionMode) => {
    setInteractionMode(nextMode);
    iframeRef.current?.contentWindow?.postMessage({ type: MODE_MESSAGE, mode: nextMode }, "*");
  };

  const onSubmit = async () => {
    setError(null);
    setErrorType(null);
    setResult(null);
    setCopied(false);

    if (!url.trim()) {
      setError("Please enter a URL.");
      return;
    }

    if (extractionMode === "custom" && !extractionPrompt.trim()) {
      setError("Describe the data you want to extract.");
      return;
    }

    let parsedSchema: Record<string, unknown> | undefined;
    if (extractionMode === "custom" && jsonSchema.trim()) {
      try {
        const candidate = JSON.parse(jsonSchema) as unknown;
        if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
          setError("JSON Schema must be a JSON object.");
          return;
        }
        parsedSchema = candidate as Record<string, unknown>;
      } catch {
        setError("JSON Schema is not valid JSON.");
        return;
      }
    }

    setIsLoading(true);

    try {
      const exportPayload: {
        url: string;
        selectors: string[];
        html_snapshot?: string;
        base_url?: string;
        ai_cleanup: boolean;
        extraction_mode: ExtractionMode;
        extraction_prompt?: string;
        json_schema?: Record<string, unknown>;
      } = {
        url: url.trim(),
        selectors: extractionMode === "standard" && cleanupMode === "manual" ? selections : [],
        ai_cleanup: extractionMode === "standard" && cleanupMode === "ai",
        extraction_mode: extractionMode,
      };
      if (extractionMode === "custom") {
        exportPayload.extraction_prompt = extractionPrompt.trim();
        if (parsedSchema) exportPayload.json_schema = parsedSchema;
      }

      if (extractionMode === "standard" && previewSnapshot && previewBaseUrl) {
        let finalSnapshot = previewSnapshot;
        if (iframeRef.current?.contentDocument) {
          const docCopy = iframeRef.current.contentDocument.cloneNode(true) as Document;
          docCopy.getElementById("json-picker-style")?.remove();
          docCopy.getElementById("json-picker-script")?.remove();
          Array.from(docCopy.getElementsByTagName("script")).forEach((script) => script.remove());
          finalSnapshot = docCopy.documentElement.outerHTML;
        }
        exportPayload.html_snapshot = finalSnapshot;
        exportPayload.base_url = previewBaseUrl;
      }

      const response = await runExportJob("json", exportPayload, token);

      const payload = (await response.json()) as ExportResult | ErrorPayload;

      if (!response.ok) {
        const detail = (payload as ErrorPayload).detail;
        if (response.status === 402) {
          setErrorType("no_credits");
          setError(detail ?? "Insufficient balance.");
        } else if (response.status === 403) {
          setErrorType("anon_limit");
          setError(detail ?? "Free download limit reached.");
        } else {
          setErrorType("generic");
          setError(detail ?? "Failed to export structured JSON.");
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

  const onBulkSubmit = async () => {
    setError(null);
    setErrorType(null);
    setBulkResult(null);

    if (validBulkUrls.length === 0) {
      setError("Please enter at least one URL.");
      return;
    }

    if (!token) {
      setErrorType("anon_limit");
      setError("Sign in to export multiple pages.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await runExportJob(
        "bulk-json",
        { urls: validBulkUrls, output_mode: bulkOutputMode, ai_cleanup: bulkAiCleanup },
        token,
      );

      const payload = (await response.json()) as BulkExportResult | ErrorPayload;

      if (!response.ok) {
        const detail = (payload as ErrorPayload).detail;
        if (response.status === 402) {
          setErrorType("no_credits");
          setError(detail ?? "Insufficient balance.");
        } else if (response.status === 403) {
          setErrorType("anon_limit");
          setError(detail ?? "Sign in to export multiple pages.");
        } else {
          setErrorType("generic");
          setError(detail ?? "Failed to generate JSON for the selected pages.");
        }
        return;
      }

      setBulkResult(payload as BulkExportResult);
      void refreshUser();
    } catch {
      setError("Unable to reach backend. Ensure Django server is running.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyJson = async () => {
    if (!formattedJson) return;
    await navigator.clipboard.writeText(formattedJson);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const downloadJson = () => {
    if (!result) return;
    const blob = new Blob([formattedJson], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    const filename = result.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || "structured-page";
    link.download = `${filename}.json`;
    link.click();
    URL.revokeObjectURL(href);
  };

  return (
    <main className="app-tool-page min-h-screen">
      <div className="mx-auto w-full max-w-5xl px-4 pb-8 sm:py-8">
        <header className="card-header">
          <h1>Website to JSON Converter</h1>
          <h2 className="subtitle">Extract standard fields or describe the custom JSON your workflow needs</h2>
          <p className="subtitle">
            Use custom instructions and an optional JSON Schema to extract specific records and fields, or export the page with the built-in standard structure.
          </p>
        </header>

        <div className="card-grid" style={{ marginTop: "1.9rem" }}>
          <div className="control-stack">
            <Switch
              label="Export mode"
              value={toolMode}
              options={[
                { value: "single", label: "Single page" },
                { value: "bulk", label: "Bulk URLs" },
                { value: "domain", label: "Domain pages" },
              ]}
              onChange={(mode) => {
                setToolMode(mode);
                setError(null);
                setDomainPagesDiscovered(false);
                if (mode === "single") setBulkResult(null);
                else setResult(null);
              }}
            />

            {toolMode === "single" ? (
              <>
                <form onSubmit={handlePreview} className="export-form">
                  <label htmlFor="url">Website URL</label>
                  <div className="url-row">
                    <input
                      id="url"
                      type="url"
                      placeholder="https://example.com/article"
                      value={url}
                      onChange={(event) => {
                        setUrl(event.target.value);
                        setPreviewError(null);
                        setSelections([]);
                      }}
                      required
                    />
                  </div>
                </form>

                {previewError && <p className="message error">{previewError}</p>}

                <div className="toggle-group">
                  <span>Extraction type</span>
                  <div className="toggle-buttons">
                    <button type="button" className={extractionMode === "standard" ? "active" : ""} onClick={() => setExtractionMode("standard")}>
                      Standard page fields
                    </button>
                    <button type="button" className={extractionMode === "custom" ? "active" : ""} onClick={() => setExtractionMode("custom")}>
                      Custom extraction
                    </button>
                  </div>
                </div>

                {extractionMode === "custom" && (
                  <div className="custom-extraction-fields">
                    <label htmlFor="extraction-prompt">What should be extracted?</label>
                    <textarea
                      id="extraction-prompt"
                      value={extractionPrompt}
                      onChange={(event) => setExtractionPrompt(event.target.value)}
                      placeholder="Extract every product's name, price, rating, and availability."
                      rows={3}
                      maxLength={4000}
                    />
                    <label htmlFor="json-schema">
                      JSON Schema <span>(optional)</span>
                    </label>
                    <textarea
                      id="json-schema"
                      value={jsonSchema}
                      onChange={(event) => setJsonSchema(event.target.value)}
                      placeholder={'{"type":"object","properties":{"products":{"type":"array","items":{"type":"object","properties":{"name":{"type":"string"},"price":{"type":"string"}},"required":["name","price"]}}},"required":["products"]}'}
                      rows={7}
                      spellCheck={false}
                    />
                    <p>Without a schema, AI chooses suitable fields. With a schema, the result is validated before it is returned.</p>
                  </div>
                )}

                {extractionMode === "standard" && (
                  <div className="toggle-group">
                    <span>Cleanup method</span>
                    <div className="toggle-buttons">
                      <button type="button" className={cleanupMode === "full" ? "active" : ""} onClick={() => setCleanupMode("full")}>
                        Full Page export
                      </button>
                      <button type="button" className={cleanupMode === "ai" ? "active" : ""} onClick={() => {
                        setCleanupMode("ai");
                        handleInteractionModeChange("cursor");
                      }}>
                        AI Cleanup
                      </button>
                      <button type="button" className={cleanupMode === "manual" ? "active" : ""} onClick={() => setCleanupMode("manual")}>
                        Manual Interaction
                      </button>
                    </div>
                  </div>
                )}

                {extractionMode === "standard" && cleanupMode === "manual" && <div className="preview-shell">
                  {previewBlobUrl ? (
                    <div className="preview-panel">
                      <div className="preview-head">
                        <div className="preview-head-left">
                          <h2>{previewTitle ?? "Preview"}</h2>
                          <p>Browse the page or click elements to remove them before extraction.</p>
                        </div>
                        {cleanupMode === "manual" && <div className="toggle-buttons">
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
                        </div>}
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
                      <p>Load a page to preview it and choose anything you want removed from the JSON output.</p>
                    </div>
                  )}
                </div>}

                {extractionMode === "standard" && cleanupMode === "manual" && <div className="selection-list">
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
                        <span className="chip" key={selector}>{selector}</span>
                      ))}
                    </div>
                  ) : (
                    <span className="empty">No selections yet.</span>
                  )}
                </div>}

                <div className="export-actions">
                  <button type="button" onClick={onSubmit} disabled={isLoading} className={isLoading ? "export-loading" : ""}>
                    {isLoading ? "Extracting JSON..." : extractionMode === "custom" ? "Extract Custom JSON" : "Export JSON"}
                  </button>
                </div>

                {error && (
                  <div className="message error">
                    <span>{error}</span>
                    {errorType === "no_credits" && (
                      <button type="button" className="inline-action" onClick={() => setShowPaymentModal(true)}>
                        Add Funds
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
                    <div className="json-result-header">
                      <div>
                        <h2>{result.title}</h2>
                        <p>Your structured JSON is ready.</p>
                      </div>
                      <div className="json-result-actions">
                        <button type="button" onClick={copyJson}>
                          {copied ? <Check size={16} /> : <Copy size={16} />}
                          {copied ? "Copied" : "Copy"}
                        </button>
                        <button type="button" onClick={downloadJson}>
                          <Download size={16} />
                          Download .json
                        </button>
                      </div>
                    </div>
                    <pre className="json-preview"><code>{formattedJson}</code></pre>
                  </div>
                )}
              </>
            ) : (
              <>
                {toolMode === "domain" ? (
                  <DomainPageDiscovery
                    token={token}
                    value={domainUrls}
                    onChange={setDomainUrls}
                    onError={setError}
                    onAuthRequired={() => setShowAuthModal(true)}
                    onDiscoveryChange={setDomainPagesDiscovered}
                  />
                ) : (
                  <div className="export-form">
                    <label>Website URLs</label>
                    <BulkUrlInput value={bulkUrls} onChange={setBulkUrls} maxUrls={50} validCount={validBulkUrls.length} />
                  </div>
                )}

                {(toolMode === "bulk" || domainPagesDiscovered) && (
                  <>
                    <div className="toggle-group">
                      <span>Output format</span>
                      <div className="toggle-buttons">
                        <button
                          type="button"
                          className={bulkOutputMode === "zip" ? "active" : ""}
                          onClick={() => setBulkOutputMode("zip")}
                        >
                          ZIP (one .json per URL)
                        </button>
                        <button
                          type="button"
                          className={bulkOutputMode === "combined" ? "active" : ""}
                          onClick={() => setBulkOutputMode("combined")}
                        >
                          Combined JSON
                        </button>
                      </div>
                    </div>

                    <div className="toggle-group">
                      <span>Cleanup method</span>
                      <div className="toggle-buttons">
                        <button type="button" className={bulkAiCleanup ? "active" : ""} onClick={() => setBulkAiCleanup(true)}>
                          AI Cleanup
                        </button>
                        <button type="button" className={!bulkAiCleanup ? "active" : ""} onClick={() => setBulkAiCleanup(false)}>
                          Full Page export
                        </button>
                      </div>
                    </div>

                    {validBulkUrls.length > 0 && (
                      <div className={`credit-cost-info ${!hasEnoughBalance ? "insufficient" : ""}`}>
                        <span>
                          This will cost <strong>{formatUsd(totalCostCents)}</strong>
                          {user ? ` (balance ${formatUsd(user.balance_cents)})` : ""}
                        </span>
                        {!hasEnoughBalance && (
                          <button type="button" className="inline-action" onClick={() => setShowPaymentModal(true)}>
                            Add Funds
                          </button>
                        )}
                      </div>
                    )}

                    <div className="export-actions">
                      <button
                        type="button"
                        onClick={onBulkSubmit}
                        disabled={isLoading || !hasEnoughBalance || validBulkUrls.length === 0}
                        className={isLoading ? "export-loading" : ""}
                      >
                        {isLoading ? "Extracting JSON..." : `Export ${validBulkUrls.length || ""} page${validBulkUrls.length !== 1 ? "s" : ""} to JSON`}
                      </button>
                    </div>

                    {bulkResult && (
                      <div className="result-panel">
                        <h2>{bulkResult.title}</h2>
                        <p>Your {bulkResult.file_ext === "zip" ? "ZIP archive" : "combined JSON file"} is ready.</p>
                        <a href={bulkResult.file_url} target="_blank" rel="noreferrer" download>
                          Download .{bulkResult.file_ext}
                        </a>
                      </div>
                    )}
                  </>
                )}

                {error && (
                  <div className="message error">
                    <span>{error}</span>
                    {errorType === "no_credits" && (
                      <button type="button" className="inline-action" onClick={() => setShowPaymentModal(true)}>
                        Add Funds
                      </button>
                    )}
                    {errorType === "anon_limit" && (
                      <button type="button" className="inline-action" onClick={() => setShowAuthModal(true)}>
                        Sign In
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <ExportActivity tool="json" />
        <footer className="support-footer">
          Need help? Email us at <a href="mailto:support@extractkit.io">support@extractkit.io</a>
        </footer>
      </div>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      <PaymentModal open={showPaymentModal} onClose={() => setShowPaymentModal(false)} />
    </main>
  );
}

export default WebsiteToJson;
