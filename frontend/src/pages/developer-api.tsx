import { Check, Clipboard, Code2, KeyRound, Plug, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AuthModal } from "../components/auth-modal";
import { useAuth } from "../context/auth-context";
import { usePageSeo } from "../hooks/use-page-seo";
import {
  API_BASE_URL,
  createDeveloperKey,
  getDeveloperUsage,
  listDeveloperKeys,
  revokeDeveloperKey,
  type DeveloperAPIKey,
  type DeveloperUsage,
} from "../lib/developer-api";

const requestExample = `curl -X POST ${API_BASE_URL}/api/jobs/ \\
  -H "X-API-Key: dp_live_..." \\
  -H "Idempotency-Key: invoice-123" \\
  -H "Content-Type: application/json" \\
  -d '{
    "endpoint": "markdown",
    "payload": {"url": "https://example.com"},
    "webhook_url": "https://example.com/hooks/distillpage"
  }'`;

export default function DeveloperAPI() {
  const { token, user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [keys, setKeys] = useState<DeveloperAPIKey[]>([]);
  const [usage, setUsage] = useState<DeveloperUsage | null>(null);
  const [name, setName] = useState("");
  const [revealedKey, setRevealedKey] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState("");

  usePageSeo({
    title: "Developer API and Integrations - DistillPage",
    description: "Manage DistillPage API keys, async jobs, webhooks, usage, and automation integrations.",
    canonical: "https://distillpage.com/developer-api",
  });

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const [keyItems, usageData] = await Promise.all([listDeveloperKeys(token), getDeveloperUsage(token)]);
      setKeys(keyItems);
      setUsage(usageData);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load developer settings.");
    }
  }, [token]);

  useEffect(() => {
    const initial = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(initial);
  }, [load]);

  const createKey = async () => {
    if (!token || !name.trim()) return;
    try {
      const created = await createDeveloperKey(name.trim(), token);
      setRevealedKey(created.key ?? "");
      setName("");
      setMessage("API key created. Store it now; it will not be shown again.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create API key.");
    }
  };

  const copy = async (label: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(""), 1500);
  };

  return (
    <main className="app-tool-page min-h-screen">
      <div className="mx-auto w-full max-w-5xl px-4 pb-8 sm:py-8">
        <header className="card-header">
          <h1>Developer API and Integrations</h1>
          <h2 className="subtitle">Build reliable webpage export workflows</h2>
          <p className="subtitle">Create API keys, submit idempotent async jobs, receive signed webhooks, and connect your automation platform.</p>
          <p className="developer-doc-link"><Link to="/developers/docs">Read the developer documentation</Link></p>
        </header>

        {!user || !token ? (
          <section className="history-empty-card">
            <Code2 size={24} />
            <p>Sign in to manage developer API access.</p>
            <button type="button" className="history-primary-button" onClick={() => setShowAuthModal(true)}>Sign in</button>
          </section>
        ) : (
          <div className="developer-grid">
            <section className="history-page-section developer-usage">
              <div className="history-section-heading"><Code2 size={18} /><strong>Last 30 days</strong></div>
              <div className="developer-stats">
                <div><strong>{usage?.total_jobs ?? 0}</strong><span>Total jobs</span></div>
                <div><strong>{usage?.successful_jobs ?? 0}</strong><span>Completed</span></div>
                <div><strong>{usage?.active_jobs ?? 0}</strong><span>Active</span></div>
                <div><strong>{usage?.failed_jobs ?? 0}</strong><span>Failed</span></div>
              </div>
              {!!usage?.by_tool.length && <p className="developer-tool-usage">{usage.by_tool.map((item) => `${item.tool}: ${item.count}`).join(" · ")}</p>}
            </section>

            <section className="history-page-section">
              <div className="history-section-heading"><KeyRound size={18} /><strong>API keys</strong></div>
              <div className="developer-key-form">
                <label className="developer-key-field">
                  <span>Key name</span>
                  <input
                    value={name}
                    maxLength={120}
                    placeholder="Production"
                    onChange={(event) => setName(event.target.value)}
                  />
                </label>
                <button type="button" onClick={() => void createKey()}>Create key</button>
              </div>
              <p className="developer-key-hint">Use a descriptive name so you can tell your keys apart later.</p>
              {revealedKey && (
                <div className="developer-secret">
                  <code>{revealedKey}</code>
                  <button type="button" onClick={() => void copy("key", revealedKey)}>{copied === "key" ? <Check size={15} /> : <Clipboard size={15} />}</button>
                </div>
              )}
              <div className="developer-key-list">
                {keys.filter((key) => !key.revoked_at).map((key) => (
                  <article key={key.id}>
                    <div><strong>{key.name}</strong><code>{key.prefix}...</code></div>
                    <button type="button" aria-label={`Revoke ${key.name}`} onClick={() => void revokeDeveloperKey(key.id, token).then(load)}><Trash2 size={15} /></button>
                  </article>
                ))}
                {!keys.some((key) => !key.revoked_at) && <p className="export-history-empty">No active API keys.</p>}
              </div>
              {message && <p className="export-schedule-message">{message}</p>}
            </section>

            <section className="history-page-section developer-wide">
              <div className="history-section-heading"><Code2 size={18} /><strong>Async job request</strong></div>
              <p>Use <code>Idempotency-Key</code> to safely retry submissions. Add <code>webhook_url</code> to receive <code>export.completed</code> or <code>export.failed</code>; the response returns its signing secret once.</p>
              <div className="developer-code">
                <pre><code>{requestExample}</code></pre>
                <button type="button" onClick={() => void copy("request", requestExample)}>{copied === "request" ? <Check size={15} /> : <Clipboard size={15} />}</button>
              </div>
              <p className="developer-doc-link">Public OpenAPI documentation: <a href={`${API_BASE_URL}/api/developer/docs/`} target="_blank" rel="noreferrer">{API_BASE_URL}/api/developer/docs/</a></p>
            </section>

            <section className="history-page-section developer-wide">
              <div className="history-section-heading"><Plug size={18} /><strong>Integrations</strong></div>
              <div className="integration-cards">
                <article><strong>Zapier</strong><span>Webhooks by Zapier</span><p>Use Custom Request with the API key header.</p></article>
                <article><strong>Make</strong><span>HTTP · Make a request</span><p>POST the job payload, then handle the webhook.</p></article>
                <article><strong>n8n</strong><span>HTTP Request node</span><p>Use Header Auth and continue from a Webhook node.</p></article>
                <article><strong>AI agents / MCP</strong><span>{API_BASE_URL}/api/mcp/</span><p>Connect over HTTP using the API key header.</p></article>
              </div>
            </section>
          </div>
        )}
        {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      </div>
    </main>
  );
}
