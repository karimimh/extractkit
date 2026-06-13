import { Bell, Download, History, ListChecks, Pause, Play, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AuthModal } from "../components/auth-modal";
import { MonitorDetailsDialog } from "../components/monitor-details-dialog";
import { useAuth } from "../context/auth-context";
import { usePageSeo } from "../hooks/use-page-seo";
import {
  changeDownloadUrl,
  createMonitor,
  deleteMonitor,
  listMonitors,
  runMonitor,
  updateMonitor,
  type WebpageMonitor,
} from "../lib/monitors";

export default function ChangeMonitors() {
  const { token, user } = useAuth();
  usePageSeo({
    title: "Website Change Monitor – ExtractKit",
    description: "Monitor webpage text, selected elements, structured data, and visual screenshots for changes.",
    canonical: "https://extractkit.io/change-monitoring",
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [monitors, setMonitors] = useState<WebpageMonitor[]>([]);
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [mode, setMode] = useState<WebpageMonitor["mode"]>("text");
  const [frequency, setFrequency] = useState<WebpageMonitor["frequency"]>("daily");
  const [selectors, setSelectors] = useState("");
  const [fields, setFields] = useState("");
  const [ignoreSelectors, setIgnoreSelectors] = useState("");
  const [ignorePatterns, setIgnorePatterns] = useState("");
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [ignoreNumbers, setIgnoreNumbers] = useState(false);
  const [minimumChangePercent, setMinimumChangePercent] = useState(0);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [notifyEmail, setNotifyEmail] = useState(false);
  const [aiCleanup, setAiCleanup] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [detailsMonitor, setDetailsMonitor] = useState<WebpageMonitor | null>(null);

  const load = useCallback(async () => {
    if (!token) return setMonitors([]);
    try {
      setMonitors(await listMonitors(token));
    } catch {
      // Monitor errors remain visible on their individual cards.
    }
  }, [token]);

  useEffect(() => {
    const initial = window.setTimeout(() => void load(), 0);
    const interval = window.setInterval(() => void load(), 5000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(interval);
    };
  }, [load]);

  const submit = async () => {
    if (!token) {
      setShowAuthModal(true);
      return;
    }
    const delayMinutes = { minutely: 1, hourly: 60, daily: 60 * 24, weekly: 60 * 24 * 7, monthly: 60 * 24 * 30 }[frequency];
    const firstRun = new Date(Date.now() + delayMinutes * 60 * 1000).toISOString();
    setIsCreating(true);
    try {
      const monitor = await createMonitor({
        name,
        url,
        mode,
        frequency,
        next_run_at: firstRun,
        selectors: selectors.split(",").map((value) => value.trim()).filter(Boolean),
        fields: fields.split(",").map((value) => value.trim()).filter(Boolean),
        ignore_selectors: ignoreSelectors.split(",").map((value) => value.trim()).filter(Boolean),
        ignore_patterns: ignorePatterns.split("\n").map((value) => value.trim()).filter(Boolean),
        ignore_whitespace: ignoreWhitespace,
        ignore_case: ignoreCase,
        ignore_numbers: ignoreNumbers,
        minimum_change_percent: minimumChangePercent,
        webhook_url: webhookUrl,
        notify_email: notifyEmail,
        ai_cleanup: aiCleanup,
      }, token);
      setMessage(monitor.webhook_secret
        ? `Monitor created. Webhook signing secret: ${monitor.webhook_secret}`
        : "Monitor created and initial check queued.");
      setName("");
      setUrl("");
      setWebhookUrl("");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create monitor.");
    } finally {
      setIsCreating(false);
    }
  };

  const checkNow = async (monitor: WebpageMonitor) => {
    try {
      await runMonitor(monitor.id, token);
      setMessage("Monitor check queued.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not run monitor.");
    }
  };

  const modeLabel = (monitor: WebpageMonitor) => ({
    text: "Cleaned text",
    selected: "Selected elements",
    structured: "Structured fields",
    visual: "Visual screenshot",
  })[monitor.mode];

  const frequencyLabel = (monitor: WebpageMonitor) => monitor.frequency === "minutely" ? "Every minute" : monitor.frequency;

  return (
    <main className="app-tool-page min-h-screen">
      <div className="mx-auto w-full max-w-5xl px-4 pb-8 sm:py-8">
        <header className="card-header">
          <h1>Website Change Monitor</h1>
          <h2 className="subtitle">Track meaningful webpage changes automatically</h2>
          <p className="subtitle">Monitor cleaned text, selected elements, structured fields, or visual captures and receive notifications when they change.</p>
        </header>

        <div className="monitor-page-grid">
          <section className="monitor-create-card">
            <div className="monitor-section-heading"><Bell size={18} /><strong>New monitor</strong></div>
            <div className="monitor-form-grid">
              <label>Name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Competitor pricing" /></label>
              <label>URL<input type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com/pricing" /></label>
              <label>Monitor
                <select value={mode} onChange={(event) => setMode(event.target.value as WebpageMonitor["mode"])}>
                  <option value="text">Cleaned text</option>
                  <option value="selected">Selected elements</option>
                  <option value="structured">Structured JSON fields</option>
                  <option value="visual">Visual screenshot</option>
                </select>
              </label>
              <label>Frequency
                <select value={frequency} onChange={(event) => setFrequency(event.target.value as WebpageMonitor["frequency"])}>
                  <option value="minutely">Every minute (testing)</option><option value="hourly">Hourly</option><option value="daily">Daily</option>
                  <option value="weekly">Weekly</option><option value="monthly">Monthly</option>
                </select>
              </label>
              {(mode === "selected" || mode === "visual") && <label>CSS selectors, comma separated<input value={selectors} onChange={(event) => setSelectors(event.target.value)} placeholder=".price, #availability" /></label>}
              {mode === "structured" && <label>JSON fields, comma separated<input value={fields} onChange={(event) => setFields(event.target.value)} placeholder="title, metadata.description, tables.0.rows" /></label>}
              <fieldset className="monitor-noise-controls">
                <legend>Reduce unwanted alerts</legend>
                <label>Minimum change percentage
                  <input type="number" min={0} max={100} step={0.1} value={minimumChangePercent} onChange={(event) => setMinimumChangePercent(Number(event.target.value))} />
                </label>
                <label>Ignore CSS selectors, comma separated
                  <input value={ignoreSelectors} onChange={(event) => setIgnoreSelectors(event.target.value)} placeholder=".timestamp, .rotating-banner" />
                </label>
                <label>Ignore text patterns, one regular expression per line
                  <textarea rows={3} value={ignorePatterns} onChange={(event) => setIgnorePatterns(event.target.value)} placeholder={"Updated \\d{2}:\\d{2}\nAdvertisement"} />
                </label>
                <div className="monitor-noise-checks">
                  <label className="monitor-check"><input type="checkbox" checked={ignoreWhitespace} onChange={(event) => setIgnoreWhitespace(event.target.checked)} /> Ignore whitespace changes</label>
                  <label className="monitor-check"><input type="checkbox" checked={ignoreCase} onChange={(event) => setIgnoreCase(event.target.checked)} /> Ignore capitalization changes</label>
                  <label className="monitor-check"><input type="checkbox" checked={ignoreNumbers} onChange={(event) => setIgnoreNumbers(event.target.checked)} /> Ignore number changes</label>
                </div>
              </fieldset>
              <label>Webhook, Slack, or Discord URL<input type="url" value={webhookUrl} onChange={(event) => setWebhookUrl(event.target.value)} /></label>
              <label className="monitor-check"><input type="checkbox" checked={aiCleanup} onChange={(event) => setAiCleanup(event.target.checked)} /> AI cleanup</label>
              <label className="monitor-check"><input type="checkbox" checked={notifyEmail} onChange={(event) => setNotifyEmail(event.target.checked)} /> Email me when changed</label>
              <button type="button" className="monitor-primary-button" onClick={() => void submit()} disabled={!url || isCreating}>
                {isCreating ? <RefreshCw className="monitor-spinning-icon" size={14} /> : <Plus size={14} />} {isCreating ? "Creating..." : "Create monitor"}
              </button>
            </div>
          </section>

          <section className="monitor-list-section">
            <div className="monitor-section-heading"><ListChecks size={18} /><strong>Your monitors</strong></div>
            {message && <p className="export-schedule-message">{message}</p>}
            {!user && <div className="monitor-empty-card"><p>Sign in to create monitors and view detected changes.</p><button type="button" className="monitor-primary-button" onClick={() => setShowAuthModal(true)}>Sign in</button></div>}
            {user && !monitors.length && <div className="monitor-empty-card"><p>No monitors yet. Create one to establish its first baseline.</p></div>}
            <div className="monitor-card-list">
            {monitors.map((monitor) => (
              <article key={monitor.id} className="monitor-card">
                <div className="export-history-row">
                  <strong>{monitor.name || monitor.url}</strong>
                  <span className={`job-status ${monitor.is_running ? "running" : monitor.is_active ? "completed" : "failed"}`}>
                    {monitor.is_running ? "checking" : monitor.is_active ? "active" : "paused"}
                  </span>
                </div>
                <a className="monitor-url" href={monitor.url} target="_blank" rel="noreferrer">{monitor.url}</a>
                <dl className="monitor-details">
                  <div><dt>Monitoring</dt><dd>{modeLabel(monitor)}{monitor.ai_cleanup ? " + AI cleanup" : ""}</dd></div>
                  <div><dt>Frequency</dt><dd>{frequencyLabel(monitor)}</dd></div>
                  <div><dt>Next check</dt><dd>{monitor.is_active ? new Date(monitor.next_run_at).toLocaleString() : "Paused"}</dd></div>
                  <div><dt>Last completed check</dt><dd>{monitor.last_run_at ? new Date(monitor.last_run_at).toLocaleString() : "Not completed yet"}</dd></div>
                  <div><dt>Last change</dt><dd>{monitor.last_changed_at ? new Date(monitor.last_changed_at).toLocaleString() : "None detected"}</dd></div>
                  <div><dt>Notifications</dt><dd>{[monitor.notify_email && "Email", monitor.webhook_configured && "Webhook"].filter(Boolean).join(" + ") || "None"}</dd></div>
                  <div><dt>Alert threshold</dt><dd>{monitor.minimum_change_percent ? `${monitor.minimum_change_percent}% or more` : "Any detected change"}</dd></div>
                </dl>
                {!!monitor.selectors.length && <small>Selectors: {monitor.selectors.join(", ")}</small>}
                {!!monitor.fields.length && <small>Fields: {monitor.fields.join(", ")}</small>}
                {!!monitor.ignore_selectors.length && <small>Ignored selectors: {monitor.ignore_selectors.join(", ")}</small>}
                {(monitor.ignore_whitespace || monitor.ignore_case || monitor.ignore_numbers || !!monitor.ignore_patterns.length) && <small>Noise rules enabled</small>}
                {monitor.last_error && <p className="monitor-error"><strong>Last check failed:</strong> {monitor.last_error}</p>}
                {monitor.latest_change && <p className="monitor-change-summary">{monitor.latest_change.summary}</p>}
                <div className="export-history-actions">
                  <button type="button" onClick={() => setDetailsMonitor(monitor)}><History size={14} /> Details &amp; history</button>
                  <button type="button" disabled={monitor.is_running} onClick={() => void checkNow(monitor)}>
                    <RefreshCw className={monitor.is_running ? "monitor-spinning-icon" : ""} size={14} /> {monitor.is_running ? "Checking..." : monitor.last_error ? "Retry check" : "Check now"}
                  </button>
                  <button type="button" onClick={() => void updateMonitor(monitor.id, { is_active: !monitor.is_active }, token).then(() => load())}>
                    {monitor.is_active ? <Pause size={14} /> : <Play size={14} />} {monitor.is_active ? "Pause" : "Resume"}
                  </button>
                  {monitor.latest_change && <a href={changeDownloadUrl(monitor.latest_change)}><Download size={14} /> Comparison</a>}
                  <button type="button" onClick={() => void deleteMonitor(monitor.id, token).then(() => load())}><Trash2 size={14} /> Delete</button>
                </div>
              </article>
            ))}
            </div>
          </section>
          </div>
        {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
        <MonitorDetailsDialog
          key={detailsMonitor?.id ?? "closed-monitor-details"}
          monitor={detailsMonitor}
          token={token}
          onClose={() => setDetailsMonitor(null)}
          onMonitorUpdated={(updated) => {
            setDetailsMonitor(updated);
            setMonitors((current) => current.map((monitor) => monitor.id === updated.id ? updated : monitor));
          }}
        />
      </div>
    </main>
  );
}
