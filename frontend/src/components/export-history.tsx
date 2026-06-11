import { Download, History, RefreshCw, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/auth-context";
import { exportJobDownloadUrl, listExportJobs, rerunExportJob, type ExportJob } from "../lib/export-jobs";

export function ExportHistory() {
  const { token, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [jobs, setJobs] = useState<ExportJob[]>([]);

  const load = useCallback(async () => {
    if (!token) return setJobs([]);
    try {
      setJobs(await listExportJobs(token));
    } catch {
      // History is supplementary; individual tool errors remain visible in their pages.
    }
  }, [token]);

  useEffect(() => {
    const initial = window.setTimeout(() => void load(), 0);
    const update = () => void load();
    window.addEventListener("export-job-updated", update);
    const interval = window.setInterval(() => void load(), 2500);
    return () => {
      window.removeEventListener("export-job-updated", update);
      window.clearTimeout(initial);
      window.clearInterval(interval);
    };
  }, [load]);

  if (!user || !token) return null;

  return (
    <>
      <button type="button" className="export-history-trigger" onClick={() => setOpen(true)}>
        <History size={17} /> Export history
      </button>
      {open && (
        <aside className="export-history-panel" aria-label="Export history">
          <header>
            <div><History size={18} /><strong>Export history</strong></div>
            <button type="button" aria-label="Close export history" onClick={() => setOpen(false)}><X size={18} /></button>
          </header>
          <div className="export-history-list">
            {!jobs.length && <p className="export-history-empty">No exports yet.</p>}
            {jobs.map((job) => (
              <article key={job.id}>
                <div className="export-history-row">
                  <strong>{job.title || job.tool.toUpperCase()}</strong>
                  <span className={`job-status ${job.status}`}>{job.status}</span>
                </div>
                <small>{job.tool.toUpperCase()} · {new Date(job.created_at).toLocaleString()}</small>
                {job.error && <p>{job.error}</p>}
                <div className="export-history-actions">
                  {job.status === "completed" && <a href={exportJobDownloadUrl(job)} download><Download size={14} /> Download</a>}
                  <button type="button" onClick={() => void rerunExportJob(job.id, token)}><RefreshCw size={14} /> Rerun</button>
                </div>
              </article>
            ))}
          </div>
        </aside>
      )}
    </>
  );
}
