import { CheckSquare, Globe2, Square } from "lucide-react";
import { useState } from "react";
import { AuthModal } from "../components/auth-modal";
import { PaymentModal } from "../components/payment-modal";
import { useAuth } from "../context/auth-context";
import { usePageSeo } from "../hooks/use-page-seo";
import { runExportJob } from "../lib/export-jobs";

type ExportFormat = "markdown" | "pdf" | "json" | "screenshot";
type OutputMode = "zip" | "combined";
type CrawlResult = {
  urls: string[];
  count: number;
  source: string;
  truncated: boolean;
  failed_urls: string[];
};
type ExportResult = { title: string; file_url: string; file_ext: string };
type ErrorPayload = { detail?: string };

function parsePatterns(value: string) {
  return value.split("\n").map((pattern) => pattern.trim()).filter(Boolean);
}

export default function WebsiteBulkExport() {
  usePageSeo({
    title: "Website Bulk Export – DistillPage",
    description: "Discover and export every page from a website.",
    canonical: "https://distillpage.com/website-bulk-export",
  });
  const { user, token, refreshUser } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [url, setUrl] = useState("");
  const [maxPages, setMaxPages] = useState(50);
  const [maxDepth, setMaxDepth] = useState(2);
  const [includePatterns, setIncludePatterns] = useState("");
  const [excludePatterns, setExcludePatterns] = useState("");
  const [sitemapOnly, setSitemapOnly] = useState(false);
  const [crawlResult, setCrawlResult] = useState<CrawlResult | null>(null);
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [format, setFormat] = useState<ExportFormat>("markdown");
  const [outputMode, setOutputMode] = useState<OutputMode>("zip");
  const [aiCleanup, setAiCleanup] = useState(false);
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCrawling, setIsCrawling] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const crawl = async () => {
    setError(null);
    setCrawlResult(null);
    setExportResult(null);
    if (!token) {
      setShowAuthModal(true);
      setError("Sign in to discover and export an entire website.");
      return;
    }
    setIsCrawling(true);
    try {
      const response = await runExportJob("crawl", {
          url,
          max_pages: maxPages,
          max_depth: maxDepth,
          include_patterns: parsePatterns(includePatterns),
          exclude_patterns: parsePatterns(excludePatterns),
          sitemap_only: sitemapOnly,
        }, token);
      const payload = (await response.json()) as CrawlResult | ErrorPayload;
      if (!response.ok) {
        setError((payload as ErrorPayload).detail ?? "Failed to crawl website.");
        return;
      }
      const result = payload as CrawlResult;
      setCrawlResult(result);
      setSelectedUrls(result.urls);
    } catch {
      setError("Unable to reach backend. Ensure Django server is running.");
    } finally {
      setIsCrawling(false);
    }
  };

  const exportPages = async () => {
    if (!token) {
      setShowAuthModal(true);
      return;
    }
    if (!selectedUrls.length) {
      setError("Select at least one discovered page.");
      return;
    }
    setError(null);
    setExportResult(null);
    setIsExporting(true);
    const endpoint = {
      markdown: "bulk-markdown",
      pdf: "bulk-pdf",
      json: "bulk-json",
      screenshot: "bulk-screenshot",
    }[format];
    try {
      const response = await runExportJob(endpoint, {
          urls: selectedUrls,
          output_mode: format === "screenshot" ? "zip" : outputMode,
          ai_cleanup: aiCleanup,
        }, token);
      const payload = (await response.json()) as ExportResult | ErrorPayload;
      if (!response.ok) {
        setError((payload as ErrorPayload).detail ?? "Failed to export website.");
        return;
      }
      setExportResult(payload as ExportResult);
      void refreshUser();
    } catch {
      setError("Unable to reach backend. Ensure Django server is running.");
    } finally {
      setIsExporting(false);
    }
  };

  const toggleUrl = (pageUrl: string) => {
    setSelectedUrls((current) =>
      current.includes(pageUrl) ? current.filter((item) => item !== pageUrl) : [...current, pageUrl]
    );
  };
  const hasEnoughCredits = !user || user.download_credits >= selectedUrls.length;

  return (
    <main className="app-tool-page min-h-screen">
      <div className="mx-auto w-full max-w-5xl px-4 pb-8 sm:py-8">
        <header className="card-header">
          <h1>Website Bulk Export</h1>
          <h2 className="subtitle">Discover and export an entire website</h2>
          <p className="subtitle">Find same-domain pages from the sitemap and internal links, choose what to include, then export them together.</p>
        </header>

        <div className="card-grid crawler-grid" style={{ marginTop: "1.9rem" }}>
          <div className="control-stack">
            <form className="export-form" onSubmit={(event) => { event.preventDefault(); void crawl(); }}>
              <label htmlFor="crawler-url">Website URL</label>
              <input id="crawler-url" type="url" required placeholder="https://example.com or https://example.com/sitemap.xml" value={url} onChange={(event) => setUrl(event.target.value)} />
            </form>

            <div className="crawler-options">
              <label>Maximum pages<input type="number" min={1} max={50} value={maxPages} onChange={(event) => setMaxPages(Number(event.target.value))} /></label>
              <label>Maximum link depth<input type="number" min={0} max={5} value={maxDepth} onChange={(event) => setMaxDepth(Number(event.target.value))} disabled={sitemapOnly} /></label>
            </div>

            <div className="crawler-options">
              <label>Include path patterns<textarea placeholder={"/blog/*\n/docs/*"} value={includePatterns} onChange={(event) => setIncludePatterns(event.target.value)} /></label>
              <label>Exclude path patterns<textarea placeholder={"/admin/*\n/tag/*"} value={excludePatterns} onChange={(event) => setExcludePatterns(event.target.value)} /></label>
            </div>

            <label className="crawler-checkbox">
              <input type="checkbox" checked={sitemapOnly} onChange={(event) => setSitemapOnly(event.target.checked)} />
              Use sitemap only
            </label>

            <div className="export-actions">
              <button type="button" onClick={() => void crawl()} disabled={isCrawling || !url} className={`crawler-discover-button${isCrawling ? " export-loading" : ""}`}>
                <Globe2 size={16} /> {isCrawling ? "Discovering pages..." : "Discover pages"}
              </button>
            </div>

            {error && <div className="message error"><span>{error}</span></div>}

            {crawlResult && (
              <div className="crawler-results">
                <div className="crawler-results-head">
                  <div><strong>{crawlResult.count} pages discovered</strong><span>{crawlResult.truncated ? " · limit reached" : ""}</span></div>
                  <button type="button" className="ghost" onClick={() => setSelectedUrls(selectedUrls.length === crawlResult.urls.length ? [] : crawlResult.urls)}>
                    {selectedUrls.length === crawlResult.urls.length ? <CheckSquare size={16} /> : <Square size={16} />}
                    {selectedUrls.length === crawlResult.urls.length ? "Clear all" : "Select all"}
                  </button>
                </div>
                <div className="crawler-url-list">
                  {crawlResult.urls.map((pageUrl) => (
                    <label key={pageUrl}>
                      <input type="checkbox" checked={selectedUrls.includes(pageUrl)} onChange={() => toggleUrl(pageUrl)} />
                      <span>{pageUrl}</span>
                    </label>
                  ))}
                </div>
                {crawlResult.failed_urls.length > 0 && (
                  <p className="crawler-failed-note">
                    {crawlResult.failed_urls.length} page{crawlResult.failed_urls.length !== 1 ? "s" : ""} could not be inspected while discovering links.
                  </p>
                )}
              </div>
            )}

            {crawlResult && (
              <>
                <div className="toggle-group">
                  <span>Export format</span>
                  <div className="toggle-buttons">
                    {(["markdown", "pdf", "json", "screenshot"] as ExportFormat[]).map((item) => (
                      <button type="button" key={item} className={format === item ? "active" : ""} onClick={() => setFormat(item)}>
                        {item === "screenshot" ? "Screenshots" : item.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                {format !== "screenshot" && <div className="toggle-group">
                  <span>Output</span>
                  <div className="toggle-buttons">
                    <button type="button" className={outputMode === "zip" ? "active" : ""} onClick={() => setOutputMode("zip")}>ZIP, one file per page</button>
                    <button type="button" className={outputMode === "combined" ? "active" : ""} onClick={() => setOutputMode("combined")}>Combined file</button>
                  </div>
                </div>}
                <div className="toggle-group">
                  <span>Cleanup method</span>
                  <div className="toggle-buttons">
                    <button type="button" className={!aiCleanup ? "active" : ""} onClick={() => setAiCleanup(false)}>Full Page export</button>
                    <button type="button" className={aiCleanup ? "active" : ""} onClick={() => setAiCleanup(true)}>AI Cleanup</button>
                  </div>
                </div>
                <div className={`credit-cost-info ${!hasEnoughCredits ? "insufficient" : ""}`}>
                  <span>Exporting {selectedUrls.length} page{selectedUrls.length !== 1 ? "s" : ""} uses <strong>{selectedUrls.length} credits</strong>{user ? ` (you have ${user.download_credits})` : ""}</span>
                  {!hasEnoughCredits && <button type="button" className="inline-action" onClick={() => setShowPaymentModal(true)}>Buy Credits</button>}
                </div>
                <div className="export-actions">
                  <button type="button" onClick={() => void exportPages()} disabled={isExporting || !selectedUrls.length || !hasEnoughCredits} className={isExporting ? "export-loading" : ""}>
                    {isExporting ? "Exporting website..." : `Export ${selectedUrls.length} selected pages`}
                  </button>
                </div>
              </>
            )}

            {exportResult && <div className="result-panel"><h2>{exportResult.title}</h2><p>Your website export is ready.</p><a href={exportResult.file_url} target="_blank" rel="noreferrer" download>Download .{exportResult.file_ext}</a></div>}
          </div>
        </div>
      </div>
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      {showPaymentModal && <PaymentModal onClose={() => setShowPaymentModal(false)} />}
    </main>
  );
}
