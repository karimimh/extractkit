import { Download, FileClock, GitCompareArrows, Image as ImageIcon, RotateCcw, SlidersHorizontal } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  listMonitorChanges,
  listMonitorSnapshots,
  monitorAssetUrl,
  restoreMonitorSnapshot,
  updateMonitor,
  type MonitorChange,
  type MonitorSnapshot,
  type WebpageMonitor,
} from "../lib/monitors";
import { Dialog } from "./shared/dialog";

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
  const [view, setView] = useState<"snapshots" | "changes">("snapshots");
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<number | null>(null);
  const [selectedChangeId, setSelectedChangeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [restoring, setRestoring] = useState(false);
  const [savingRules, setSavingRules] = useState(false);
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
      const [snapshotHistory, changeHistory] = await Promise.all([
        listMonitorSnapshots(monitor.id, token),
        listMonitorChanges(monitor.id, token),
      ]);
      setSnapshots(snapshotHistory);
      setChanges(changeHistory);
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
                    <span>{new Date(change.created_at).toLocaleString()}</span>
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
                  {selectedChange.before_image_url || selectedChange.after_image_url ? (
                    <div className="monitor-image-comparison">
                      {[
                        ["Before", selectedChange.before_image_url],
                        ["After", selectedChange.after_image_url],
                        ["Difference", selectedChange.diff_image_url],
                      ].map(([label, image]) => image && (
                        <figure key={label}>
                          <figcaption><ImageIcon size={14} /> {label}</figcaption>
                          <img src={monitorAssetUrl(image) ?? ""} alt={`${label} visual capture`} />
                        </figure>
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className="monitor-data-comparison">
                        <div><h4>Before</h4><pre className="monitor-data-preview">{formattedData(selectedChange.before)}</pre></div>
                        <div><h4>After</h4><pre className="monitor-data-preview">{formattedData(selectedChange.after)}</pre></div>
                      </div>
                      {selectedChange.diff && <div className="monitor-diff-preview"><h4>Difference</h4><pre>{selectedChange.diff}</pre></div>}
                    </>
                  )}
                </section>
              )}
            </div>
          )}
        </>
      )}
    </Dialog>
  );
}
