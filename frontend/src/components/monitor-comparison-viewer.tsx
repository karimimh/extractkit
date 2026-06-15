import { Brain, Check, Columns2, EyeOff, Image as ImageIcon, RefreshCw, Rows3 } from "lucide-react";
import { useMemo, useState } from "react";
import { monitorAssetUrl, type MonitorChange } from "../lib/monitors";

type ChangeKind = "added" | "removed" | "modified" | "unchanged";
type Filter = "all" | Exclude<ChangeKind, "unchanged">;
type DiffRow = { before?: string; after?: string; kind: ChangeKind };

function textLines(data: Record<string, unknown>) {
  const value = typeof data.text === "string" ? data.text : JSON.stringify(data, null, 2);
  return value.split("\n").slice(0, 500);
}

function lineRows(before: string[], after: string[]) {
  const lengths = Array.from({ length: before.length + 1 }, () => new Uint16Array(after.length + 1));
  for (let left = before.length - 1; left >= 0; left -= 1) {
    for (let right = after.length - 1; right >= 0; right -= 1) {
      lengths[left][right] = before[left] === after[right]
        ? lengths[left + 1][right + 1] + 1
        : Math.max(lengths[left + 1][right], lengths[left][right + 1]);
    }
  }
  const raw: DiffRow[] = [];
  let left = 0;
  let right = 0;
  while (left < before.length || right < after.length) {
    if (left < before.length && right < after.length && before[left] === after[right]) {
      raw.push({ before: before[left], after: after[right], kind: "unchanged" });
      left += 1;
      right += 1;
    } else if (right < after.length && (left === before.length || lengths[left][right + 1] >= lengths[left + 1][right])) {
      raw.push({ after: after[right], kind: "added" });
      right += 1;
    } else {
      raw.push({ before: before[left], kind: "removed" });
      left += 1;
    }
  }
  const rows: DiffRow[] = [];
  for (let index = 0; index < raw.length; index += 1) {
    const current = raw[index];
    const next = raw[index + 1];
    if (current.kind === "removed" && next?.kind === "added") {
      rows.push({ before: current.before, after: next.after, kind: "modified" });
      index += 1;
    } else if (current.kind === "added" && next?.kind === "removed") {
      rows.push({ before: next.before, after: current.after, kind: "modified" });
      index += 1;
    } else {
      rows.push(current);
    }
  }
  return rows;
}

function flatten(value: unknown, prefix = "", result: Record<string, unknown> = {}) {
  if (value !== null && typeof value === "object") {
    const entries = Array.isArray(value) ? value.map((item, index) => [String(index), item] as const) : Object.entries(value);
    if (!entries.length && prefix) result[prefix] = value;
    entries.forEach(([key, item]) => flatten(item, prefix ? `${prefix}.${key}` : key, result));
  } else {
    result[prefix || "value"] = value;
  }
  return result;
}

function valueText(value: unknown) {
  return typeof value === "string" ? value : JSON.stringify(value);
}

function ComparisonFilters({ filter, onChange }: { filter: Filter; onChange: (filter: Filter) => void }) {
  return (
    <div className="monitor-comparison-filters" aria-label="Filter comparison">
      {(["all", "added", "removed", "modified"] as Filter[]).map((option) => (
        <button type="button" className={filter === option ? "active" : ""} key={option} onClick={() => onChange(option)}>
          {option[0].toUpperCase() + option.slice(1)}
        </button>
      ))}
    </div>
  );
}

function TextComparison({ change }: { change: MonitorChange }) {
  const [layout, setLayout] = useState<"side" | "inline">("side");
  const [filter, setFilter] = useState<Filter>("all");
  const rows = useMemo(() => lineRows(textLines(change.before), textLines(change.after)), [change]);
  const visibleRows = filter === "all" ? rows : rows.filter((row) => row.kind === filter);

  return (
    <>
      <div className="monitor-comparison-toolbar">
        <ComparisonFilters filter={filter} onChange={setFilter} />
        <div className="monitor-layout-toggle">
          <button type="button" className={layout === "side" ? "active" : ""} onClick={() => setLayout("side")}><Columns2 size={14} /> Side by side</button>
          <button type="button" className={layout === "inline" ? "active" : ""} onClick={() => setLayout("inline")}><Rows3 size={14} /> Inline</button>
        </div>
      </div>
      {layout === "side" ? (
        <div className="monitor-text-diff monitor-text-diff-side">
          <div className="monitor-diff-column-title">Before</div><div className="monitor-diff-column-title">After</div>
          {visibleRows.map((row, index) => (
            <div className="monitor-diff-row" key={`${index}-${row.kind}`}>
              <code className={row.kind === "removed" || row.kind === "modified" ? "removed" : ""}>{row.before ?? ""}</code>
              <code className={row.kind === "added" || row.kind === "modified" ? "added" : ""}>{row.after ?? ""}</code>
            </div>
          ))}
        </div>
      ) : (
        <div className="monitor-text-diff monitor-text-diff-inline">
          {visibleRows.flatMap((row, index) => row.kind === "modified"
            ? [<code className="removed" key={`${index}-old`}>- {row.before}</code>, <code className="added" key={`${index}-new`}>+ {row.after}</code>]
            : [<code className={row.kind} key={index}>{row.kind === "added" ? "+ " : row.kind === "removed" ? "- " : "  "}{row.after ?? row.before}</code>])}
        </div>
      )}
      {!visibleRows.length && <p className="monitor-dialog-state">No {filter} content in this comparison.</p>}
    </>
  );
}

function StructuredComparison({ change }: { change: MonitorChange }) {
  const [filter, setFilter] = useState<Filter>("all");
  const rows = useMemo(() => {
    const before = flatten(change.before);
    const after = flatten(change.after);
    return Array.from(new Set([...Object.keys(before), ...Object.keys(after)])).sort().map((field) => {
      const hasBefore = Object.hasOwn(before, field);
      const hasAfter = Object.hasOwn(after, field);
      const kind: ChangeKind = !hasBefore ? "added" : !hasAfter ? "removed" : JSON.stringify(before[field]) !== JSON.stringify(after[field]) ? "modified" : "unchanged";
      return { field, before: before[field], after: after[field], kind };
    });
  }, [change]);
  const visibleRows = filter === "all" ? rows : rows.filter((row) => row.kind === filter);
  return (
    <>
      <div className="monitor-comparison-toolbar"><ComparisonFilters filter={filter} onChange={setFilter} /></div>
      <div className="monitor-structured-table-wrap">
        <table className="monitor-structured-table">
          <thead><tr><th>Field</th><th>Before</th><th>After</th><th>Change</th></tr></thead>
          <tbody>{visibleRows.map((row) => <tr key={row.field} className={row.kind}><th>{row.field}</th><td>{valueText(row.before)}</td><td>{valueText(row.after)}</td><td><span>{row.kind}</span></td></tr>)}</tbody>
        </table>
      </div>
    </>
  );
}

function VisualComparison({ change }: { change: MonitorChange }) {
  const [position, setPosition] = useState(50);
  const before = monitorAssetUrl(change.before_image_url);
  const after = monitorAssetUrl(change.after_image_url);
  return (
    <div className="monitor-visual-comparison">
      {before && after && <div className="monitor-image-slider">
        <img src={after} alt="After visual capture" />
        <div className="monitor-image-slider-before" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}><img src={before} alt="Before visual capture" /></div>
        <div className="monitor-image-slider-line" style={{ left: `${position}%` }} />
        <input type="range" min={0} max={100} value={position} onChange={(event) => setPosition(Number(event.target.value))} aria-label="Compare before and after images" />
        <span className="before-label">Before</span><span className="after-label">After</span>
      </div>}
      {change.diff_image_url && <figure className="monitor-difference-image"><figcaption><ImageIcon size={14} /> Changed visual regions</figcaption><img src={monitorAssetUrl(change.diff_image_url) ?? ""} alt="Highlighted changed visual regions" /></figure>}
    </div>
  );
}

export function MonitorComparisonViewer({ change, savingStatus, analyzing, onStatusChange, onAnalyze }: {
  change: MonitorChange;
  savingStatus: boolean;
  analyzing: boolean;
  onStatusChange: (status: MonitorChange["status"]) => void;
  onAnalyze: () => void;
}) {
  return (
    <div className="monitor-comparison-viewer">
      <section className="monitor-ai-intelligence">
        <div className="monitor-ai-heading">
          <div><Brain size={16} /><strong>AI Change Intelligence</strong></div>
          <button type="button" disabled={analyzing} onClick={onAnalyze}><RefreshCw size={14} /> {analyzing ? "Analyzing..." : change.ai_analyzed_at ? "Re-analyze" : "Analyze"}</button>
        </div>
        {change.ai_summary ? <>
          <p>{change.ai_summary}</p>
          <div className="monitor-ai-tags">
            {change.ai_importance && <span className={`importance-${change.ai_importance}`}>{change.ai_importance} importance</span>}
            {change.ai_categories.map((category) => <span key={category}>{category}</span>)}
            {change.ai_insignificant && <span>insignificant</span>}
          </div>
          {change.ai_why_it_matters && <div className="monitor-ai-why"><strong>Why this matters</strong><span>{change.ai_why_it_matters}</span></div>}
        </> : <p className="monitor-dialog-state">No intelligence analysis has been generated for this change.</p>}
      </section>
      <div className="monitor-review-actions">
        <span className={`monitor-review-status ${change.status}`}>{change.status === "pending" ? "Pending review" : change.status}</span>
        <button type="button" disabled={savingStatus || change.status === "reviewed"} onClick={() => onStatusChange("reviewed")}><Check size={14} /> Mark reviewed</button>
        <button type="button" disabled={savingStatus || change.status === "ignored"} onClick={() => onStatusChange("ignored")}><EyeOff size={14} /> Ignore change</button>
      </div>
      {change.mode === "visual" ? <VisualComparison change={change} /> : change.mode === "structured" ? <StructuredComparison change={change} /> : <TextComparison change={change} />}
    </div>
  );
}
