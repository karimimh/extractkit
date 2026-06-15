import { Bell, Copy, Download, Edit3, History, ListChecks, Pause, Play, Plus, RefreshCw, RotateCcw, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AuthModal } from "../components/auth-modal";
import { MonitorDetailsDialog } from "../components/monitor-details-dialog";
import { MonitorEditDialog } from "../components/monitor-edit-dialog";
import { useAuth } from "../context/auth-context";
import { usePageSeo } from "../hooks/use-page-seo";
import {
  changeDownloadUrl,
  createMonitor,
  deleteMonitor,
  duplicateMonitor,
  getMonitorIntelligenceSummary,
  listMonitors,
  monitorAssetUrl,
  resetMonitorBaseline,
  runMonitor,
  updateMonitor,
  type WebpageMonitor,
  type MonitorIntelligenceSummary,
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
  const [project, setProject] = useState("");
  const [tags, setTags] = useState("");
  const [ignoreSelectors, setIgnoreSelectors] = useState("");
  const [ignorePatterns, setIgnorePatterns] = useState("");
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [ignoreNumbers, setIgnoreNumbers] = useState(false);
  const [minimumChangePercent, setMinimumChangePercent] = useState(0);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [notifyEmail, setNotifyEmail] = useState(false);
  const [aiCleanup, setAiCleanup] = useState(false);
  const [aiChangeAnalysis, setAiChangeAnalysis] = useState(true);
  const [autoIgnoreInsignificant, setAutoIgnoreInsignificant] = useState(false);
  const [intelligenceSummary, setIntelligenceSummary] = useState<MonitorIntelligenceSummary | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [detailsMonitor, setDetailsMonitor] = useState<WebpageMonitor | null>(null);
  const [editMonitor, setEditMonitor] = useState<WebpageMonitor | null>(null);
  const [selectedMonitorIds, setSelectedMonitorIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | WebpageMonitor["status"]>("all");
  const [sortBy, setSortBy] = useState<"next" | "name" | "last-change">("next");
  const [bulkWorking, setBulkWorking] = useState(false);

  const load = useCallback(async () => {
    if (!token) {
      setMonitors([]);
      setIntelligenceSummary(null);
      return;
    }
    try {
      const [loadedMonitors, summary] = await Promise.all([listMonitors(token), getMonitorIntelligenceSummary(token)]);
      setMonitors(loadedMonitors);
      setIntelligenceSummary(summary);
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
        project,
        tags: tags.split(",").map((value) => value.trim()).filter(Boolean),
        ignore_selectors: ignoreSelectors.split(",").map((value) => value.trim()).filter(Boolean),
        ignore_patterns: ignorePatterns.split("\n").map((value) => value.trim()).filter(Boolean),
        ignore_whitespace: ignoreWhitespace,
        ignore_case: ignoreCase,
        ignore_numbers: ignoreNumbers,
        minimum_change_percent: minimumChangePercent,
        webhook_url: webhookUrl,
        notify_email: notifyEmail,
        ai_cleanup: aiCleanup,
        ai_change_analysis: aiChangeAnalysis,
        auto_ignore_insignificant: autoIgnoreInsignificant,
      }, token);
      setMessage(monitor.webhook_secret
        ? `Monitor created. Webhook signing secret: ${monitor.webhook_secret}`
        : "Monitor created and initial check queued.");
      setName("");
      setUrl("");
      setProject("");
      setTags("");
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
  const filteredMonitors = monitors
    .filter((monitor) => {
      const query = search.trim().toLowerCase();
      const matchesSearch = !query || [monitor.name, monitor.url, monitor.project, ...monitor.tags].some((value) => value.toLowerCase().includes(query));
      return matchesSearch && (statusFilter === "all" || monitor.status === statusFilter);
    })
    .sort((left, right) => {
      if (sortBy === "name") return (left.name || left.url).localeCompare(right.name || right.url);
      if (sortBy === "last-change") return (right.last_changed_at || "").localeCompare(left.last_changed_at || "");
      return left.next_run_at.localeCompare(right.next_run_at);
    });

  const updateInList = (updated: WebpageMonitor) => {
    setMonitors((current) => current.map((monitor) => monitor.id === updated.id ? updated : monitor));
  };

  const resetBaseline = async (monitor: WebpageMonitor) => {
    if (!window.confirm(`Reset the comparison baseline for ${monitor.name || monitor.url}?`)) return;
    try {
      updateInList(await resetMonitorBaseline(monitor.id, token));
      setMessage("The next successful check will establish a new baseline.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not reset baseline.");
    }
  };

  const duplicate = async (monitor: WebpageMonitor) => {
    try {
      const duplicated = await duplicateMonitor(monitor.id, token);
      setMonitors((current) => [...current, duplicated]);
      setMessage("Monitor duplicated and baseline check queued.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not duplicate monitor.");
    }
  };

  const runBulkAction = async (action: "run" | "pause" | "resume" | "delete") => {
    const selected = monitors.filter((monitor) => selectedMonitorIds.includes(monitor.id));
    if (!selected.length) return;
    if (action === "delete" && !window.confirm(`Delete ${selected.length} selected monitor(s)?`)) return;
    setBulkWorking(true);
    try {
      await Promise.all(selected.map((monitor) => {
        if (action === "run") return runMonitor(monitor.id, token);
        if (action === "delete") return deleteMonitor(monitor.id, token);
        return updateMonitor(monitor.id, { is_active: action === "resume" }, token);
      }));
      setSelectedMonitorIds([]);
      setMessage(`${selected.length} monitor(s) updated.`);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update selected monitors.");
    } finally {
      setBulkWorking(false);
    }
  };

  const faviconUrl = (url: string) => {
    try {
      return `${new URL(url).origin}/favicon.ico`;
    } catch {
      return "";
    }
  };

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
              <label>Project<input value={project} onChange={(event) => setProject(event.target.value)} placeholder="Competitors" /></label>
              <label>Tags, comma separated<input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="pricing, important" /></label>
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
              <label className="monitor-check"><input type="checkbox" checked={aiChangeAnalysis} onChange={(event) => setAiChangeAnalysis(event.target.checked)} /> AI change intelligence</label>
              <label className="monitor-check"><input type="checkbox" checked={autoIgnoreInsignificant} disabled={!aiChangeAnalysis} onChange={(event) => setAutoIgnoreInsignificant(event.target.checked)} /> Auto-ignore insignificant changes</label>
              <label className="monitor-check"><input type="checkbox" checked={notifyEmail} onChange={(event) => setNotifyEmail(event.target.checked)} /> Email me when changed</label>
              <button type="button" className="monitor-primary-button" onClick={() => void submit()} disabled={!url || isCreating}>
                {isCreating ? <RefreshCw className="monitor-spinning-icon" size={14} /> : <Plus size={14} />} {isCreating ? "Creating..." : "Create monitor"}
              </button>
            </div>
          </section>

          <section className="monitor-list-section">
            <div className="monitor-section-heading"><ListChecks size={18} /><strong>Your monitors</strong></div>
            {intelligenceSummary && intelligenceSummary.change_count > 0 && <section className="monitor-weekly-intelligence">
              <div><strong>7-day AI intelligence</strong><span>{intelligenceSummary.summary}</span></div>
              <div className="monitor-ai-tags">
                {Object.entries(intelligenceSummary.categories).map(([category, count]) => <span key={category}>{category}: {count}</span>)}
              </div>
              {!!intelligenceSummary.highlights.length && <ul>{intelligenceSummary.highlights.slice(0, 3).map((highlight) => <li key={highlight.change_id}><strong>{highlight.monitor}</strong>: {highlight.summary}</li>)}</ul>}
            </section>}
            {message && <p className="export-schedule-message">{message}</p>}
            {!user && <div className="monitor-empty-card"><p>Sign in to create monitors and view detected changes.</p><button type="button" className="monitor-primary-button" onClick={() => setShowAuthModal(true)}>Sign in</button></div>}
            {user && !monitors.length && <div className="monitor-empty-card"><p>No monitors yet. Create one to establish its first baseline.</p></div>}
            {!!monitors.length && <div className="monitor-list-controls">
              <label className="monitor-search"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, URL, project, or tag" /></label>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} aria-label="Filter monitor status">
                <option value="all">All statuses</option><option value="active">Active</option><option value="baseline">Baseline</option><option value="checking">Checking</option><option value="failed">Failed</option><option value="paused">Paused</option>
              </select>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)} aria-label="Sort monitors">
                <option value="next">Next check</option><option value="name">Name</option><option value="last-change">Latest change</option>
              </select>
            </div>}
            {!!selectedMonitorIds.length && <div className="monitor-bulk-actions">
              <strong>{selectedMonitorIds.length} selected</strong>
              <button type="button" disabled={bulkWorking} onClick={() => void runBulkAction("run")}><RefreshCw size={14} /> Check now</button>
              <button type="button" disabled={bulkWorking} onClick={() => void runBulkAction("pause")}><Pause size={14} /> Pause</button>
              <button type="button" disabled={bulkWorking} onClick={() => void runBulkAction("resume")}><Play size={14} /> Resume</button>
              <button type="button" disabled={bulkWorking} onClick={() => void runBulkAction("delete")}><Trash2 size={14} /> Delete</button>
            </div>}
            <div className="monitor-card-list">
            {filteredMonitors.map((monitor) => (
              <article key={monitor.id} className="monitor-card">
                <div className="monitor-card-header">
                  <input type="checkbox" checked={selectedMonitorIds.includes(monitor.id)} onChange={(event) => setSelectedMonitorIds((current) => event.target.checked ? [...current, monitor.id] : current.filter((id) => id !== monitor.id))} aria-label={`Select ${monitor.name || monitor.url}`} />
                  <img src={faviconUrl(monitor.url)} alt="" onError={(event) => { event.currentTarget.style.visibility = "hidden"; }} />
                  <div>
                    <strong>{monitor.latest_snapshot?.title || monitor.name || monitor.url}</strong>
                    {monitor.name && monitor.latest_snapshot?.title && <span>{monitor.name}</span>}
                  </div>
                  <span className={`job-status ${monitor.status}`}>{monitor.status}</span>
                </div>
                {(monitor.project || monitor.tags.length > 0) && <div className="monitor-card-labels">
                  {monitor.project && <span>{monitor.project}</span>}
                  {monitor.tags.map((tag) => <span key={tag}>#{tag}</span>)}
                </div>}
                {monitor.latest_snapshot && <div className="monitor-card-preview">
                  {monitor.latest_snapshot.image_url
                    ? <img src={monitorAssetUrl(monitor.latest_snapshot.image_url) ?? ""} alt={`Latest snapshot of ${monitor.url}`} />
                    : <pre>{JSON.stringify(monitor.latest_snapshot.data, null, 2).slice(0, 320)}</pre>}
                </div>}
                <a className="monitor-url" href={monitor.url} target="_blank" rel="noreferrer">{monitor.url}</a>
                <dl className="monitor-details">
                  <div><dt>Monitoring</dt><dd>{modeLabel(monitor)}{monitor.ai_cleanup ? " + AI cleanup" : ""}</dd></div>
                  <div><dt>Frequency</dt><dd>{frequencyLabel(monitor)}</dd></div>
                  <div><dt>Next check</dt><dd>{monitor.is_active ? new Date(monitor.next_run_at).toLocaleString() : "Paused"}</dd></div>
                  <div><dt>Last successful check</dt><dd>{monitor.last_success_at ? new Date(monitor.last_success_at).toLocaleString() : "No successful check yet"}</dd></div>
                  <div><dt>Latest change</dt><dd>{monitor.latest_change ? `${monitor.latest_change.changed_percent.toFixed(2)}% · ${new Date(monitor.latest_change.created_at).toLocaleString()}` : "None detected"}</dd></div>
                  <div><dt>Notifications</dt><dd>{[
                    (monitor.notification_emails.length || monitor.notify_email) && "Email",
                    monitor.webhook_configured && "Webhook",
                    monitor.slack_webhook_url && "Slack",
                    monitor.discord_webhook_url && "Discord",
                    monitor.teams_webhook_url && "Teams",
                    monitor.telegram_bot_configured && monitor.telegram_chat_id && "Telegram",
                  ].filter(Boolean).join(" + ") || "None"} · {monitor.notification_frequency === "immediate" ? "immediate" : `${monitor.notification_frequency} digest`}</dd></div>
                  <div><dt>Failures</dt><dd>{monitor.consecutive_failures ? `${monitor.consecutive_failures} consecutive` : "None"}</dd></div>
                  <div><dt>Alert threshold</dt><dd>{monitor.minimum_change_percent ? `${monitor.minimum_change_percent}% or more` : "Any detected change"}</dd></div>
                </dl>
                {!!monitor.selectors.length && <small>Selectors: {monitor.selectors.join(", ")}</small>}
                {!!monitor.fields.length && <small>Fields: {monitor.fields.join(", ")}</small>}
                {!!monitor.ignore_selectors.length && <small>Ignored selectors: {monitor.ignore_selectors.join(", ")}</small>}
                {(monitor.ignore_whitespace || monitor.ignore_case || monitor.ignore_numbers || !!monitor.ignore_patterns.length) && <small>Noise rules enabled</small>}
                {monitor.last_error && <p className="monitor-error"><strong>Last check failed:</strong> {monitor.last_error}</p>}
                {monitor.latest_change && <p className="monitor-change-summary">{monitor.latest_change.ai_summary || monitor.latest_change.summary}</p>}
                <div className="export-history-actions">
                  <button type="button" onClick={() => setDetailsMonitor(monitor)}><History size={14} /> Details &amp; history</button>
                  <button type="button" onClick={() => setEditMonitor(monitor)}><Edit3 size={14} /> Edit</button>
                  <button type="button" onClick={() => void duplicate(monitor)}><Copy size={14} /> Duplicate</button>
                  <button type="button" disabled={monitor.is_running} onClick={() => void resetBaseline(monitor)}><RotateCcw size={14} /> Reset baseline</button>
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
            {!filteredMonitors.length && !!monitors.length && <div className="monitor-empty-card"><p>No monitors match the current search and filter.</p></div>}
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
        <MonitorEditDialog
          key={editMonitor?.id ?? "closed-monitor-edit"}
          monitor={editMonitor}
          token={token}
          onClose={() => setEditMonitor(null)}
          onSaved={(updated) => {
            updateInList(updated);
            setEditMonitor(null);
            setMessage("Monitor updated. The next successful check will establish a new baseline when needed.");
          }}
        />
      </div>
    </main>
  );
}
