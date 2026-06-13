import { Download } from "lucide-react";
import { useState } from "react";
import { ExportActivity } from "../components/export-activity";
import { useAuth } from "../context/auth-context";
import { usePageSeo } from "../hooks/use-page-seo";
import { runExportJob } from "../lib/export-jobs";

type ExportFormat = "csv" | "xlsx";
type ExportResult = { title: string; file_url: string; file_ext: string };
type ErrorPayload = { detail?: string | Record<string, unknown> };

function errorMessage(payload: ErrorPayload, fallback: string) {
  if (typeof payload.detail === "string") return payload.detail;
  return fallback;
}

export default function WebsiteToTabular({ format }: { format: ExportFormat }) {
  const isExcel = format === "xlsx";
  const formatName = isExcel ? "Excel" : "CSV";
  const extension = isExcel ? "xlsx" : "csv";
  const { token, refreshUser } = useAuth();
  const [url, setUrl] = useState("");
  const [extractionPrompt, setExtractionPrompt] = useState("");
  const [jsonSchema, setJsonSchema] = useState("");
  const [result, setResult] = useState<ExportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  usePageSeo({
    title: `Website to ${formatName} Converter – ExtractKit`,
    description: `Extract webpage tables, listings, and custom structured data into ${formatName}.`,
    canonical: `https://extractkit.io/web-to-${isExcel ? "excel" : "csv"}`,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: `Website to ${formatName} Converter – ExtractKit`,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Web",
    },
  });

  const onSubmit = async () => {
    setError(null);
    setResult(null);
    if (!url.trim()) {
      setError("Please enter a URL.");
      return;
    }
    if (!extractionPrompt.trim()) {
      setError("Describe the records you want to extract.");
      return;
    }

    let parsedSchema: Record<string, unknown> | undefined;
    if (jsonSchema.trim()) {
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
      const response = await runExportJob("tabular", {
          url: url.trim(),
          export_format: format,
          extraction_mode: "custom",
          extraction_prompt: extractionPrompt.trim(),
          json_schema: parsedSchema,
        }, token);
      const payload = (await response.json()) as ExportResult | ErrorPayload;
      if (!response.ok) {
        setError(errorMessage(payload as ErrorPayload, `Failed to export ${formatName}.`));
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
    <main className="app-tool-page min-h-screen">
      <div className="mx-auto w-full max-w-5xl px-4 pb-8 sm:py-8">
        <header className="card-header">
          <h1>Website to {formatName} Converter</h1>
          <h2 className="subtitle">Turn tables, products, search results, and listings into usable rows</h2>
          <p className="subtitle">
            {isExcel
              ? "Create a workbook with records plus separate metadata, links, images, and tables sheets."
              : "Create a clean, UTF-8 CSV from the page's primary table or repeated custom records."}
          </p>
        </header>

        <div className="card-grid">
          <div className="control-stack">
            <div className="export-form">
              <label htmlFor="tabular-url">Website URL</label>
              <input
                id="tabular-url"
                type="url"
                placeholder="https://example.com/products"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
              />
            </div>

            <div className="custom-extraction-fields">
              <label htmlFor="tabular-prompt">What records should be extracted?</label>
              <textarea
                id="tabular-prompt"
                value={extractionPrompt}
                onChange={(event) => setExtractionPrompt(event.target.value)}
                placeholder="Extract every product's name, price, rating, and availability."
                rows={3}
                maxLength={4000}
              />
              <label htmlFor="tabular-schema">JSON Schema <span>(optional)</span></label>
              <textarea
                id="tabular-schema"
                value={jsonSchema}
                onChange={(event) => setJsonSchema(event.target.value)}
                placeholder={'{"type":"object","properties":{"products":{"type":"array","items":{"type":"object"}}}}'}
                rows={7}
                spellCheck={false}
              />
              <p>The first repeated object array becomes the exported records. Nested fields are flattened into columns.</p>
            </div>

            <div className="export-actions">
              <button type="button" onClick={onSubmit} disabled={isLoading} className={isLoading ? "export-loading" : ""}>
                {isLoading ? `Generating ${formatName}...` : `Export ${formatName}`}
              </button>
            </div>

            {error && <div className="message error">{error}</div>}
            {result && (
              <div className="result-panel">
                <h2>{result.title}</h2>
                <p>Your {formatName} export is ready.</p>
                <a href={result.file_url} download>
                  <Download size={16} /> Download .{extension}
                </a>
              </div>
            )}
          </div>
        </div>
        <ExportActivity tool={format} />
      </div>
    </main>
  );
}
