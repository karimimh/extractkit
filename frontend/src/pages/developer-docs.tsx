import { BookOpen, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { usePageSeo } from "../hooks/use-page-seo";
import { API_BASE_URL } from "../lib/developer-api";

const createJobExample = `curl -X POST ${API_BASE_URL}/api/jobs/ \\
  -H "X-API-Key: dp_live_..." \\
  -H "Idempotency-Key: order-123" \\
  -H "Content-Type: application/json" \\
  -d '{
    "endpoint": "markdown",
    "payload": {"url": "https://example.com"},
    "webhook_url": "https://example.com/hooks/distillpage"
  }'`;

const verifyWebhookExample = `signature = "sha256=" + hmac_sha256(webhook_secret, raw_request_body)
secure_compare(signature, request.headers["X-DistillPage-Signature"])`;

const endpointRows = [
  ["POST", "/api/jobs/", "Create an asynchronous export job"],
  ["GET", "/api/jobs/", "List the latest 50 jobs"],
  ["GET", "/api/jobs/{id}/", "Get job status and result"],
  ["POST", "/api/jobs/{id}/rerun/", "Create a new job from an existing request"],
  ["GET", "/api/jobs/{id}/download/", "Download a completed result"],
  ["POST", "/api/mcp/", "Use DistillPage tools through MCP JSON-RPC"],
];

const exportTypes = [
  ["pdf", "Webpage to PDF"],
  ["markdown", "Webpage to Markdown"],
  ["json", "Structured JSON extraction"],
  ["tabular", "CSV or XLSX; include payload.export_format"],
  ["screenshot", "Full-page screenshot"],
  ["crawl", "Discover same-domain pages"],
  ["bulk-pdf", "Bulk PDF export"],
  ["bulk-markdown", "Bulk Markdown export"],
  ["bulk-json", "Bulk JSON export"],
  ["bulk-screenshot", "Bulk screenshot export"],
];

export default function DeveloperDocs() {
  usePageSeo({
    title: "Developer API Documentation - DistillPage",
    description: "Build with the DistillPage public API, async export jobs, signed webhooks, automation integrations, and MCP.",
    canonical: "https://distillpage.com/developers/docs",
  });

  return (
    <main className="app-tool-page min-h-screen">
      <div className="developer-docs-layout">
        <aside className="developer-docs-nav" aria-label="Developer documentation">
          <strong>Developer API</strong>
          <a href="#quickstart">Quickstart</a>
          <a href="#authentication">Authentication</a>
          <a href="#endpoints">Endpoints</a>
          <a href="#exports">Export types</a>
          <a href="#jobs">Job lifecycle</a>
          <a href="#webhooks">Webhooks</a>
          <a href="#errors">Errors</a>
          <a href="#integrations">Integrations and MCP</a>
        </aside>

        <article className="developer-docs-content">
          <header className="developer-docs-hero">
            <BookOpen size={28} />
            <h1>DistillPage Developer API</h1>
            <p>Create reliable webpage export workflows using asynchronous jobs, idempotent requests, and signed webhooks.</p>
            <div className="developer-docs-actions">
              <Link to="/developer-api">Manage API keys</Link>
              <a href={`${API_BASE_URL}/api/developer/docs/`} target="_blank" rel="noreferrer">
                Public Swagger <ExternalLink size={14} />
              </a>
            </div>
          </header>

          <section id="quickstart">
            <h2>Quickstart</h2>
            <p>Create an API key in the <Link to="/developer-api">developer dashboard</Link>, then submit an async export job.</p>
            <pre><code>{createJobExample}</code></pre>
            <p>The API returns <code>202 Accepted</code> with a job ID. Poll its detail endpoint or provide a webhook URL.</p>
          </section>

          <section id="authentication">
            <h2>Authentication</h2>
            <p>Send your secret key in <code>X-API-Key</code>. API keys only authenticate the public jobs and MCP endpoints; they cannot manage keys, billing, or account settings.</p>
            <div className="developer-docs-note">API keys are shown once. Store them securely and revoke compromised keys from the developer dashboard.</div>
          </section>

          <section id="endpoints">
            <h2>Public endpoints</h2>
            <div className="developer-endpoint-table">
              {endpointRows.map(([method, path, description]) => (
                <div key={`${method}-${path}`}><strong>{method}</strong><code>{path}</code><span>{description}</span></div>
              ))}
            </div>
          </section>

          <section id="exports">
            <h2>Export types</h2>
            <p>Set <code>endpoint</code> to one of the supported values and place tool-specific options inside <code>payload</code>.</p>
            <div className="developer-export-types">
              {exportTypes.map(([name, description]) => <div key={name}><code>{name}</code><span>{description}</span></div>)}
            </div>
          </section>

          <section id="jobs">
            <h2>Job lifecycle and idempotency</h2>
            <p>Jobs move through <code>pending</code>, <code>running</code>, then <code>completed</code> or <code>failed</code>. Completed jobs include a result and download URL.</p>
            <p>Send a unique <code>Idempotency-Key</code> when creating a job. Retrying with the same key returns the original job instead of creating duplicate work.</p>
          </section>

          <section id="webhooks">
            <h2>Signed webhooks</h2>
            <p>Add <code>webhook_url</code> when creating a job. DistillPage returns the signing secret once and sends <code>export.completed</code> or <code>export.failed</code>.</p>
            <pre><code>{verifyWebhookExample}</code></pre>
            <p>Verify the raw body before parsing it. Deliveries include <code>X-DistillPage-Event</code>, <code>X-DistillPage-Job-Id</code>, and <code>X-DistillPage-Signature</code>.</p>
          </section>

          <section id="errors">
            <h2>Errors</h2>
            <div className="developer-error-grid">
              <div><strong>400</strong><span>Invalid endpoint, payload, webhook URL, or idempotency key</span></div>
              <div><strong>401</strong><span>Missing, invalid, or revoked API key</span></div>
              <div><strong>402</strong><span>Insufficient wallet balance</span></div>
              <div><strong>404</strong><span>Job not found or not owned by the authenticated account</span></div>
            </div>
          </section>

          <section id="integrations">
            <h2>Integrations and MCP</h2>
            <p>Zapier, Make, and n8n can submit jobs with an HTTP request step and continue workflows from a webhook trigger.</p>
            <p>AI agents can connect to <code>{API_BASE_URL}/api/mcp/</code> using the same <code>X-API-Key</code> header. The MCP server exposes create, get, and list export-job tools.</p>
          </section>
        </article>
      </div>
    </main>
  );
}
