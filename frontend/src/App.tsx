import { useMemo, useState } from "react";
import type { FormEvent } from "react";

type ExportResult = {
  title: string;
  pdf_url: string;
};

type ErrorPayload = {
  detail?: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

function App() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<ExportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const docsUrl = useMemo(() => `${API_BASE_URL}/api/docs/`, []);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setResult(null);

    if (!url.trim()) {
      setError("Please enter a URL.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/export/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: url.trim() }),
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
        <p className="eyebrow">Clean PDF Export Tool</p>
        <h1>Turn any article into a distraction-free PDF</h1>
        <p className="subtitle">
          Paste a public URL, extract the readable content, and download a neatly
          formatted PDF in seconds.
        </p>

        <form onSubmit={onSubmit} className="export-form">
          <label htmlFor="url">Article URL</label>
          <input
            id="url"
            type="url"
            placeholder="https://example.com/insightful-article"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            required
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Generating PDF..." : "Export PDF"}
          </button>
        </form>

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

        <p className="docs-link">
          API docs: <a href={docsUrl}>{docsUrl}</a>
        </p>
      </section>
    </main>
  );
}

export default App;
