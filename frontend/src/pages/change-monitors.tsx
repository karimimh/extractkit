import { Bell, Download, Pause, Play, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AuthModal } from "../components/auth-modal";
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
    title: "Webpage Monitoring – DistillPage",
    description: "Monitor webpage text, selected elements, structured data, and visual screenshots for changes.",
    canonical: "https://distillpage.com/change-monitoring",
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
  const [webhookUrl, setWebhookUrl] = useState("");
  const [notifyEmail, setNotifyEmail] = useState(false);
  const [aiCleanup, setAiCleanup] = useState(false);

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
    const delay = { hourly: 1, daily: 24, weekly: 24 * 7, monthly: 24 * 30 }[frequency];
    const firstRun = new Date(Date.now() + delay * 60 * 60 * 1000).toISOString();
    try {
      const monitor = await createMonitor({
        name,
        url,
        mode,
        frequency,
        next_run_at: firstRun,
        selectors: selectors.split(",").map((value) => value.trim()).filter(Boolean),
        fields: fields.split(",").map((value) => value.trim()).filter(Boolean),
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
    }
  };

  return (
    <main className="app-tool-page min-h-screen">
      <div className="mx-auto w-full max-w-5xl px-4 pb-8 sm:py-8">
        <header className="card-header">
          <h1>Webpage Monitoring</h1>
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
                  <option value="hourly">Hourly</option><option value="daily">Daily</option>
                  <option value="weekly">Weekly</option><option value="monthly">Monthly</option>
                </select>
              </label>
              {(mode === "selected" || mode === "visual") && <label>CSS selectors, comma separated<input value={selectors} onChange={(event) => setSelectors(event.target.value)} placeholder=".price, #availability" /></label>}
              {mode === "structured" && <label>JSON fields, comma separated<input value={fields} onChange={(event) => setFields(event.target.value)} placeholder="title, metadata.description, tables.0.rows" /></label>}
              <label>Webhook, Slack, or Discord URL<input type="url" value={webhookUrl} onChange={(event) => setWebhookUrl(event.target.value)} /></label>
              <label className="monitor-check"><input type="checkbox" checked={aiCleanup} onChange={(event) => setAiCleanup(event.target.checked)} /> AI cleanup</label>
              <label className="monitor-check"><input type="checkbox" checked={notifyEmail} onChange={(event) => setNotifyEmail(event.target.checked)} /> Email me when changed</label>
              <button type="button" className="monitor-primary-button" onClick={() => void submit()} disabled={!url}><Plus size={14} /> Create monitor</button>
            </div>
          </section>

          <section className="monitor-list-section">
            <div className="monitor-section-heading"><RefreshCw size={18} /><strong>Your monitors</strong></div>
            {message && <p className="export-schedule-message">{message}</p>}
            {!user && <div className="monitor-empty-card"><p>Sign in to create monitors and view detected changes.</p><button type="button" className="monitor-primary-button" onClick={() => setShowAuthModal(true)}>Sign in</button></div>}
            {user && !monitors.length && <div className="monitor-empty-card"><p>No monitors yet. Create one to establish its first baseline.</p></div>}
            <div className="monitor-card-list">
            {monitors.map((monitor) => (
              <article key={monitor.id} className="monitor-card">
                <div className="export-history-row">
                  <strong>{monitor.name || monitor.url}</strong>
                  <span className={`job-status ${monitor.is_active ? "completed" : "failed"}`}>{monitor.is_active ? monitor.mode : "paused"}</span>
                </div>
                <small>{monitor.frequency} · next {new Date(monitor.next_run_at).toLocaleString()}</small>
                {monitor.last_error && <p>{monitor.last_error}</p>}
                {monitor.latest_change && <p className="monitor-change-summary">{monitor.latest_change.summary}</p>}
                <div className="export-history-actions">
                  <button type="button" onClick={() => void runMonitor(monitor.id, token).then(() => setMessage("Monitor check queued."))}><RefreshCw size={14} /> Check now</button>
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
      </div>
    </main>
  );
}
