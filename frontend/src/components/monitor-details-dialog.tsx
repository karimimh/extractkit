import { Bell, Download, FileClock, GitCompareArrows, RefreshCw, RotateCcw, SlidersHorizontal } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  listMonitorChanges,
  listMonitorNotifications,
  listMonitorSnapshots,
  monitorAssetUrl,
  restoreMonitorSnapshot,
  retryMonitorNotification,
  analyzeMonitorChange,
  testMonitorNotifications,
  updateMonitorChange,
  updateMonitor,
  type MonitorChange,
  type MonitorNotificationDelivery,
  type MonitorSnapshot,
  type WebpageMonitor,
} from "../lib/monitors";
import { Dialog } from "./shared/dialog";
import { MonitorComparisonViewer } from "./monitor-comparison-viewer";

type MonitorDetailsDialogProps = {
  monitor: WebpageMonitor | null;
  token: string;
  onClose: () => void;
  onMonitorUpdated: (monitor: WebpageMonitor) => void;
};

function formattedData(data: Record<string, unknown>) {
  return JSON.stringify(data, null, 2);
}

function downloadSnapshot(snapshot: MonitorSnapshot) {
  const blob = new Blob([formattedData(snapshot.data)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `monitor-snapshot-${snapshot.id}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function MonitorDetailsDialog({ monitor, token, onClose, onMonitorUpdated }: MonitorDetailsDialogProps) {
  const [snapshots, setSnapshots] = useState<MonitorSnapshot[]>([]);
  const [changes, setChanges] = useState<MonitorChange[]>([]);
  const [notifications, setNotifications] = useState<MonitorNotificationDelivery[]>([]);
  const [view, setView] = useState<"snapshots" | "changes" | "notifications">("snapshots");
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<number | null>(null);
  const [selectedChangeId, setSelectedChangeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [restoring, setRestoring] = useState(false);
  const [savingRules, setSavingRules] = useState(false);
  const [savingChangeStatus, setSavingChangeStatus] = useState(false);
  const [analyzingChange, setAnalyzingChange] = useState(false);
  const [testingNotifications, setTestingNotifications] = useState(false);
  const [retryingNotificationId, setRetryingNotificationId] = useState<string | null>(null);
  const [minimumChangePercent, setMinimumChangePercent] = useState(monitor?.minimum_change_percent ?? 0);
  const [ignoreSelectors, setIgnoreSelectors] = useState(monitor?.ignore_selectors.join(", ") ?? "");
  const [ignorePatterns, setIgnorePatterns] = useState(monitor?.ignore_patterns.join("\n") ?? "");
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(monitor?.ignore_whitespace ?? false);
  const [ignoreCase, setIgnoreCase] = useState(monitor?.ignore_case ?? false);
  const [ignoreNumbers, setIgnoreNumbers] = useState(monitor?.ignore_numbers ?? false);

  const load = useCallback(async () => {
    if (!monitor) return;
    setLoading(true);
    setError("");
    try {
      const [snapshotHistory, changeHistory, notificationHistory] = await Promise.all([
        listMonitorSnapshots(monitor.id, token),
        listMonitorChanges(monitor.id, token),
        listMonitorNotifications(monitor.id, token),
      ]);
      setSnapshots(snapshotHistory);
      setChanges(changeHistory);
      setNotifications(notificationHistory);
      setSelectedSnapshotId(snapshotHistory[0]?.id ?? null);
      setSelectedChangeId(changeHistory[0]?.id ?? null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load monitor history.");
    } finally {
      setLoading(false);
    }
  }, [monitor, token]);

  useEffect(() => {
    if (!monitor) return;
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load, monitor]);

  const selectedSnapshot = snapshots.find((snapshot) => snapshot.id === selectedSnapshotId) ?? snapshots[0];
  const selectedChange = changes.find((change) => change.id === selectedChangeId) ?? changes[0];

  const restoreSnapshot = async (snapshot: MonitorSnapshot) => {
    if (!monitor || !window.confirm("Restore this snapshot as the new comparison baseline?")) return;
    setRestoring(true);
    setError("");
    try {
      const restored = await restoreMonitorSnapshot(monitor.id, snapshot.id, token);
      setSnapshots((current) => [restored, ...current]);
      setSelectedSnapshotId(restored.id);
    } catch (restoreError) {
      setError(restoreError instanceof Error ? restoreError.message : "Could not restore snapshot.");
    } finally {
      setRestoring(false);
    }
  };

  const saveNoiseRules = async () => {
    if (!monitor) return;
    setSavingRules(true);
    setError("");
    try {
      const updated = await updateMonitor(monitor.id, {
        minimum_change_percent: minimumChangePercent,
        ignore_selectors: ignoreSelectors.split(",").map((value) => value.trim()).filter(Boolean),
        ignore_patterns: ignorePatterns.split("\n").map((value) => value.trim()).filter(Boolean),
        ignore_whitespace: ignoreWhitespace,
        ignore_case: ignoreCase,
        ignore_numbers: ignoreNumbers,
      }, token);
      onMonitorUpdated(updated);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not update noise rules.");
    } finally {
      setSavingRules(false);
    }
  };

  const saveChangeStatus = async (status: MonitorChange["status"]) => {
    if (!selectedChange) return;
    setSavingChangeStatus(true);
    setError("");
    try {
      const updated = await updateMonitorChange(selectedChange.id, status, token);
      setChanges((current) => current.map((change) => change.id === updated.id ? updated : change));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not update change status.");
    } finally {
      setSavingChangeStatus(false);
    }
  };

  const analyzeChange = async () => {
    if (!selectedChange) return;
    setAnalyzingChange(true);
    setError("");
    try {
      const analyzed = await analyzeMonitorChange(selectedChange.id, token);
      setChanges((current) => current.map((change) => change.id === analyzed.id ? analyzed : change));
    } catch (analysisError) {
      setError(analysisError instanceof Error ? analysisError.message : "Could not analyze change.");
    } finally {
      setAnalyzingChange(false);
    }
  };

  const testNotifications = async () => {
    if (!monitor) return;
    setTestingNotifications(true);
    setError("");
    try {
      const tested = await testMonitorNotifications(monitor.id, token);
      setNotifications((current) => [...tested, ...current]);
    } catch (testError) {
      setError(testError instanceof Error ? testError.message : "Could not test notifications.");
    } finally {
      setTestingNotifications(false);
    }
  };

  const retryNotification = async (delivery: MonitorNotificationDelivery) => {
    setRetryingNotificationId(delivery.id);
    setError("");
    try {
      const retried = await retryMonitorNotification(delivery.id, token);
      setNotifications((current) => current.map((item) => item.id === retried.id ? retried : item));
    } catch (retryError) {
      setError(retryError instanceof Error ? retryError.message : "Could not retry notification.");
    } finally {
      setRetryingNotificationId(null);
    }
  };

  return (
    <Dialog
      open={Boolean(monitor)}
      onClose={onClose}
      className="monitor-details-dialog"
      size="xl"
      closeLabel="Close monitor details"
      ariaLabel="Monitor details and history"
    >
      {monitor && (
        <>
          <header className="monitor-dialog-header">
            <p className="eyebrow">Monitor details</p>
            <h2>{monitor.name || monitor.url}</h2>
            <a href={monitor.url} target="_blank" rel="noreferrer">{monitor.url}</a>
            <div className="monitor-dialog-rules">
              <span>Alert threshold: {monitor.minimum_change_percent ? `${monitor.minimum_change_percent}%` : "any change"}</span>
              {!!monitor.ignore_selectors.length && <span>Ignored selectors: {monitor.ignore_selectors.join(", ")}</span>}
              {!!monitor.ignore_patterns.length && <span>{monitor.ignore_patterns.length} ignored text pattern(s)</span>}
              {monitor.ignore_whitespace && <span>Whitespace ignored</span>}
              {monitor.ignore_case && <span>Capitalization ignored</span>}
              {monitor.ignore_numbers && <span>Numbers ignored</span>}
            </div>
            <details className="monitor-rules-editor">
              <summary><SlidersHorizontal size={15} /> Edit noise rules</summary>
              <div className="monitor-rules-editor-grid">
                <label>Minimum change percentage<input type="number" min={0} max={100} step={0.1} value={minimumChangePercent} onChange={(event) => setMinimumChangePercent(Number(event.target.value))} /></label>
                <label>Ignore CSS selectors<input value={ignoreSelectors} onChange={(event) => setIgnoreSelectors(event.target.value)} placeholder=".timestamp, .rotating-banner" /></label>
                <label className="monitor-rules-patterns">Ignore text patterns, one regular expression per line<textarea rows={3} value={ignorePatterns} onChange={(event) => setIgnorePatterns(event.target.value)} /></label>
                <label className="monitor-check"><input type="checkbox" checked={ignoreWhitespace} onChange={(event) => setIgnoreWhitespace(event.target.checked)} /> Ignore whitespace changes</label>
                <label className="monitor-check"><input type="checkbox" checked={ignoreCase} onChange={(event) => setIgnoreCase(event.target.checked)} /> Ignore capitalization changes</label>
                <label className="monitor-check"><input type="checkbox" checked={ignoreNumbers} onChange={(event) => setIgnoreNumbers(event.target.checked)} /> Ignore number changes</label>
              </div>
              <button type="button" className="monitor-primary-button" disabled={savingRules || monitor.is_running} onClick={() => void saveNoiseRules()}>
                {monitor.is_running ? "Wait for check to finish" : savingRules ? "Saving..." : "Save noise rules"}
              </button>
            </details>
          </header>

          <div className="monitor-dialog-tabs" role="tablist" aria-label="Monitor history views">
            <button type="button" className={view === "snapshots" ? "active" : ""} onClick={() => setView("snapshots")}>
              <FileClock size={16} /> Snapshots <span>{snapshots.length}</span>
            </button>
            <button type="button" className={view === "changes" ? "active" : ""} onClick={() => setView("changes")}>
              <GitCompareArrows size={16} /> Changes <span>{changes.length}</span>
            </button>
            <button type="button" className={view === "notifications" ? "active" : ""} onClick={() => setView("notifications")}>
              <Bell size={16} /> Notifications <span>{notifications.length}</span>
            </button>
          </div>

          {loading && <p className="monitor-dialog-state">Loading monitor history...</p>}
          {error && <p className="monitor-error">{error}</p>}

          {!loading && !error && view === "snapshots" && (
            <div className="monitor-history-layout">
              <aside className="monitor-history-timeline" aria-label="Snapshot timeline">
                {snapshots.map((snapshot, index) => (
                  <button
                    type="button"
                    className={snapshot.id === selectedSnapshot?.id ? "active" : ""}
                    key={snapshot.id}
                    onClick={() => setSelectedSnapshotId(snapshot.id)}
                  >
                    <strong>{index === 0 ? "Latest snapshot" : snapshot.title || `Snapshot ${snapshots.length - index}`}</strong>
                    <span>{new Date(snapshot.created_at).toLocaleString()}</span>
                  </button>
                ))}
                {!snapshots.length && <p>No snapshots yet. Run the monitor to establish its baseline.</p>}
              </aside>

              {selectedSnapshot && (
                <section className="monitor-history-content">
                  <div className="monitor-history-heading">
                    <div>
                      <p className="eyebrow">{selectedSnapshot.id === snapshots[0]?.id ? "Latest webpage snapshot" : "Webpage snapshot"}</p>
                      <h3>{selectedSnapshot.title || monitor.name || monitor.url}</h3>
                      <span>{new Date(selectedSnapshot.created_at).toLocaleString()}</span>
                    </div>
                    <div className="monitor-history-actions">
                      {selectedSnapshot.image_url && <a href={monitorAssetUrl(selectedSnapshot.image_url) ?? ""} download><Download size={15} /> Download image</a>}
                      <button type="button" onClick={() => downloadSnapshot(selectedSnapshot)}><Download size={15} /> Download JSON</button>
                      <button type="button" disabled={restoring || selectedSnapshot.id === snapshots[0]?.id} onClick={() => void restoreSnapshot(selectedSnapshot)}>
                        <RotateCcw size={15} /> {restoring ? "Restoring..." : "Restore baseline"}
                      </button>
                    </div>
                  </div>
                  {selectedSnapshot.image_url
                    ? <img className="monitor-snapshot-image" src={monitorAssetUrl(selectedSnapshot.image_url) ?? ""} alt={`Snapshot of ${monitor.url}`} />
                    : <pre className="monitor-data-preview">{formattedData(selectedSnapshot.data)}</pre>}
                </section>
              )}
            </div>
          )}

          {!loading && !error && view === "changes" && (
            <div className="monitor-history-layout">
              <aside className="monitor-history-timeline" aria-label="Change history">
                {changes.map((change) => (
                  <button
                    type="button"
                    className={change.id === selectedChange?.id ? "active" : ""}
                    key={change.id}
                    onClick={() => setSelectedChangeId(change.id)}
                  >
                    <strong>{change.changed_percent.toFixed(2)}% changed</strong>
                    <span>{new Date(change.created_at).toLocaleString()} · {change.status === "pending" ? "Pending review" : change.status}</span>
                  </button>
                ))}
                {!changes.length && <p>No changes detected yet.</p>}
              </aside>

              {selectedChange && (
                <section className="monitor-history-content">
                  <div className="monitor-history-heading">
                    <div>
                      <p className="eyebrow">Detected change</p>
                      <h3>{selectedChange.summary}</h3>
                      <span>{new Date(selectedChange.created_at).toLocaleString()}</span>
                    </div>
                    <strong className="monitor-change-percent">{selectedChange.changed_percent.toFixed(2)}%</strong>
                  </div>
                  <MonitorComparisonViewer
                    change={selectedChange}
                    savingStatus={savingChangeStatus}
                    analyzing={analyzingChange}
                    onStatusChange={(status) => void saveChangeStatus(status)}
                    onAnalyze={() => void analyzeChange()}
                  />
                </section>
              )}
            </div>
          )}

          {!loading && view === "notifications" && (
            <section className="monitor-notification-history">
              <div className="monitor-history-heading">
                <div><p className="eyebrow">Delivery history</p><h3>Notification activity</h3><span>Test configured channels and retry failed deliveries.</span></div>
                <button type="button" disabled={testingNotifications} onClick={() => void testNotifications()}><Bell size={15} /> {testingNotifications ? "Sending..." : "Send test"}</button>
              </div>
              <div className="monitor-notification-summary">
                <span>Schedule: {monitor.notification_frequency === "immediate" ? "Immediately" : `${monitor.notification_frequency} digest`}</span>
                <span>Events: {[monitor.notify_on_changed && "changed", monitor.notify_on_unavailable && "unavailable", monitor.notify_on_recovered && "recovered"].filter(Boolean).join(", ") || "none"}</span>
              </div>
              <div className="monitor-delivery-list">
                {notifications.map((delivery) => (
                  <article key={delivery.id}>
                    <div><strong>{delivery.channel} · {delivery.event}</strong><span>{delivery.destination}</span></div>
                    <div><span className={`job-status ${delivery.status}`}>{delivery.status}</span><small>{new Date(delivery.created_at).toLocaleString()} · {delivery.attempts} attempt(s)</small></div>
                    {delivery.error && <p className="monitor-error">{delivery.error}</p>}
                    {delivery.status === "failed" && <button type="button" disabled={retryingNotificationId === delivery.id} onClick={() => void retryNotification(delivery)}><RefreshCw size={14} /> {retryingNotificationId === delivery.id ? "Retrying..." : "Retry"}</button>}
                  </article>
                ))}
                {!notifications.length && <p className="monitor-dialog-state">No notification deliveries yet.</p>}
              </div>
            </section>
          )}
        </>
      )}
    </Dialog>
  );
}
