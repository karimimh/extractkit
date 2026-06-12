import { CheckSquare, Globe2, Square } from "lucide-react";
import { useState } from "react";
import { runExportJob } from "../lib/export-jobs";

type CrawlResult = {
  urls: string[];
  count: number;
  source: string;
  truncated: boolean;
  failed_urls: string[];
};

type ErrorPayload = { detail?: string };

interface DomainPageDiscoveryProps {
  token?: string | null;
  value: string;
  onChange: (value: string) => void;
  onError: (message: string | null) => void;
  onAuthRequired: () => void;
  onDiscoveryChange?: (hasResults: boolean) => void;
}

function parsePatterns(value: string) {
  return value.split("\n").map((pattern) => pattern.trim()).filter(Boolean);
}

export function DomainPageDiscovery({
  token,
  value,
  onChange,
  onError,
  onAuthRequired,
  onDiscoveryChange,
}: DomainPageDiscoveryProps) {
  const [url, setUrl] = useState("");
  const [maxPages, setMaxPages] = useState(50);
  const [maxDepth, setMaxDepth] = useState(2);
  const [includePatterns, setIncludePatterns] = useState("");
  const [excludePatterns, setExcludePatterns] = useState("");
  const [sitemapOnly, setSitemapOnly] = useState(false);
  const [crawlResult, setCrawlResult] = useState<CrawlResult | null>(null);
  const [isCrawling, setIsCrawling] = useState(false);

  const selectedUrls = value.split("\n").map((pageUrl) => pageUrl.trim()).filter(Boolean);

  const setSelectedUrls = (urls: string[]) => {
    onChange(urls.join("\n"));
  };

  const crawl = async () => {
    onError(null);
    onDiscoveryChange?.(false);
    setCrawlResult(null);
    setSelectedUrls([]);
    if (!token) {
      onAuthRequired();
      onError("Sign in to discover and export domain pages.");
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
        onError((payload as ErrorPayload).detail ?? "Failed to discover domain pages.");
        return;
      }

      const result = payload as CrawlResult;
      setCrawlResult(result);
      setSelectedUrls(result.urls);
      onDiscoveryChange?.(true);
    } catch {
      onError("Unable to reach backend. Ensure Django server is running.");
      onDiscoveryChange?.(false);
    } finally {
      setIsCrawling(false);
    }
  };

  const toggleUrl = (pageUrl: string) => {
    setSelectedUrls(
      selectedUrls.includes(pageUrl)
        ? selectedUrls.filter((item) => item !== pageUrl)
        : [...selectedUrls, pageUrl],
    );
  };

  return (
    <div className="domain-page-discovery">
      <div className="export-form">
        <label htmlFor="domain-discovery-url">Website or sitemap URL</label>
        <input
          id="domain-discovery-url"
          type="url"
          required
          placeholder="https://example.com or https://example.com/sitemap.xml"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
        />
      </div>

      <div className="crawler-options">
        <label>
          Maximum pages
          <input type="number" min={1} max={50} value={maxPages} onChange={(event) => setMaxPages(Number(event.target.value))} />
        </label>
        <label>
          Maximum link depth
          <input type="number" min={0} max={5} value={maxDepth} onChange={(event) => setMaxDepth(Number(event.target.value))} disabled={sitemapOnly} />
        </label>
      </div>

      <div className="crawler-options">
        <label>
          Include path patterns
          <textarea placeholder={"/blog/*\n/docs/*"} value={includePatterns} onChange={(event) => setIncludePatterns(event.target.value)} />
        </label>
        <label>
          Exclude path patterns
          <textarea placeholder={"/admin/*\n/tag/*"} value={excludePatterns} onChange={(event) => setExcludePatterns(event.target.value)} />
        </label>
      </div>

      <label className="crawler-checkbox">
        <input type="checkbox" checked={sitemapOnly} onChange={(event) => setSitemapOnly(event.target.checked)} />
        Use sitemap only
      </label>

      <div className="export-actions">
        <button type="button" onClick={() => void crawl()} disabled={isCrawling || !url} className={`crawler-discover-button${isCrawling ? " export-loading" : ""}`}>
          <Globe2 size={16} /> {isCrawling ? "Discovering pages..." : "Discover domain pages"}
        </button>
      </div>

      {crawlResult && (
        <div className="crawler-results">
          <div className="crawler-results-head">
            <div>
              <strong>{crawlResult.count} pages discovered</strong>
              <span>{crawlResult.truncated ? " · limit reached" : ""}</span>
            </div>
            <button
              type="button"
              className="ghost"
              onClick={() => setSelectedUrls(selectedUrls.length === crawlResult.urls.length ? [] : crawlResult.urls)}
            >
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
    </div>
  );
}
