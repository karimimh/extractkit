import { CalendarClock, Download, History, Pause, Play, RefreshCw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/auth-context";
import { Dialog } from "./shared/dialog";
import {
  createExportSchedule,
  deleteExportSchedule,
  exportJobDownloadUrl,
  listExportJobs,
  listExportSchedules,
  rerunExportJob,
  updateExportSchedule,
  type ExportJob,
  type ExportSchedule,
} from "../lib/export-jobs";

type ExportActivityProps = {
  tool?: string;
  label?: string;
  dialog?: boolean;
  open?: boolean;
  onClose?: () => void;
};

export function ExportActivity({ tool, label = "Scheduling & history", dialog = false, open = false, onClose }: ExportActivityProps) {
  const { token } = useAuth();
  const [jobs, setJobs] = useState<ExportJob[]>([]);
  const [schedules, setSchedules] = useState<ExportSchedule[]>([]);
  const [sourceJob, setSourceJob] = useState<ExportJob | null>(null);
  const [frequency, setFrequency] = useState<ExportSchedule["frequency"]>("daily");
  const [nextRunAt, setNextRunAt] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    if (!token) {
      setJobs([]);
      setSchedules([]);
      return;
    }
    try {
      const [jobItems, scheduleItems] = await Promise.all([listExportJobs(token), listExportSchedules(token)]);
      setJobs(jobItems);
      setSchedules(scheduleItems);
    } catch {
      setMessage("Could not load export activity.");
    }
  }, [token]);

  useEffect(() => {
    const initial = window.setTimeout(() => void load(), 0);
    const update = () => void load();
    const interval = window.setInterval(update, 2500);
    window.addEventListener("export-job-updated", update);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(interval);
      window.removeEventListener("export-job-updated", update);
    };
  }, [load]);

  const visibleJobs = useMemo(() => jobs.filter((job) => !tool || job.tool === tool), [jobs, tool]);
  const visibleSchedules = useMemo(() => schedules.filter((schedule) => !tool || schedule.tool === tool), [schedules, tool]);

  const beginSchedule = (job: ExportJob) => {
    const firstRun = new Date(Date.now() + 24 * 60 * 60 * 1000);
    firstRun.setSeconds(0, 0);
    setSourceJob(job);
    setNextRunAt(new Date(firstRun.getTime() - firstRun.getTimezoneOffset() * 60_000).toISOString().slice(0, 16));
    setMessage("");
  };

  const createSchedule = async () => {
    if (!sourceJob || !nextRunAt || !token) return;
    try {
      const created = await createExportSchedule(sourceJob.id, {
        name: sourceJob.title || `${sourceJob.tool.toUpperCase()} export`,
        frequency,
        next_run_at: new Date(nextRunAt).toISOString(),
        webhook_url: webhookUrl,
      }, token);
      setMessage(created.webhook_secret ? `Schedule created. Webhook signing secret: ${created.webhook_secret}` : "Schedule created.");
      setSourceJob(null);
      setWebhookUrl("");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create schedule.");
    }
  };

  const content = (
    <div className="export-activity-content">
      {!token ? (
        <p className="export-history-empty">Sign in to view export history and create schedules.</p>
      ) : (
        <>
          <section>
            <div className="history-section-heading"><History size={17} /><strong>Recent exports</strong></div>
            <div className="export-history-list">
              {!visibleJobs.length && <p className="export-history-empty">No exports yet.</p>}
              {visibleJobs.map((job) => (
                <article key={job.id}>
                  <div className="export-history-row">
                    <strong>{job.title || job.tool.toUpperCase()}</strong>
                    <span className={`job-status ${job.status}`}>{job.status}</span>
                  </div>
                  <small>{job.tool.toUpperCase()} · {new Date(job.created_at).toLocaleString()}</small>
                  {job.error && <p>{job.error}</p>}
                  <div className="export-history-actions">
                    {job.status === "completed" && <a href={exportJobDownloadUrl(job)} download><Download size={14} /> Download</a>}
                    <button type="button" onClick={() => void rerunExportJob(job.id, token).then(load)}><RefreshCw size={14} /> Rerun</button>
                    {job.status === "completed" && <button type="button" onClick={() => beginSchedule(job)}><CalendarClock size={14} /> Schedule</button>}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section>
            <div className="history-section-heading"><CalendarClock size={17} /><strong>Schedules</strong></div>
            {sourceJob && (
              <div className="export-schedule-form">
                <strong>Schedule {sourceJob.title || sourceJob.tool.toUpperCase()}</strong>
                <label>Frequency
                  <select value={frequency} onChange={(event) => setFrequency(event.target.value as ExportSchedule["frequency"])}>
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </label>
                <label>First run
                  <input type="datetime-local" value={nextRunAt} onChange={(event) => setNextRunAt(event.target.value)} />
                </label>
                <label>Webhook URL (optional)
                  <input type="url" placeholder="https://example.com/webhooks/export" value={webhookUrl} onChange={(event) => setWebhookUrl(event.target.value)} />
                </label>
                <div className="export-history-actions">
                  <button type="button" onClick={() => void createSchedule()}><CalendarClock size={14} /> Create</button>
                  <button type="button" onClick={() => setSourceJob(null)}>Cancel</button>
                </div>
              </div>
            )}
            {!visibleSchedules.length && !sourceJob && <p className="export-history-empty">No schedules yet. Schedule a completed export above.</p>}
            <div className="export-schedule-list">
              {visibleSchedules.map((schedule) => (
                <article key={schedule.id}>
                  <div className="export-history-row">
                    <strong>{schedule.name || schedule.tool.toUpperCase()}</strong>
                    <span className={`job-status ${schedule.is_active ? "completed" : "failed"}`}>{schedule.is_active ? schedule.frequency : "paused"}</span>
                  </div>
                  <small>Next run: {new Date(schedule.next_run_at).toLocaleString()}{schedule.webhook_configured ? " · webhook" : ""}</small>
                  <div className="export-history-actions">
                    <button type="button" onClick={() => void updateExportSchedule(schedule.id, { is_active: !schedule.is_active }, token).then(load)}>
                      {schedule.is_active ? <Pause size={14} /> : <Play size={14} />} {schedule.is_active ? "Pause" : "Resume"}
                    </button>
                    <button type="button" onClick={() => void deleteExportSchedule(schedule.id, token).then(load)}><Trash2 size={14} /> Delete</button>
                  </div>
                </article>
              ))}
            </div>
          </section>
          {message && <p className="export-schedule-message">{message}</p>}
        </>
      )}
    </div>
  );

  if (dialog) {
    return (
      <Dialog open={open} onClose={onClose ?? (() => {})} className="dialog-wide export-history-dialog" size="xl" closeLabel="Close export history dialog" ariaLabel="Export History">
        <div className="modal-header">
          <h2>Export History</h2>
          <p className="modal-subtitle">Review exports and manage recurring schedules.</p>
        </div>
        {content}
      </Dialog>
    );
  }

  return (
    <details className="export-activity">
      <summary><CalendarClock size={17} /> {label}</summary>
      {content}
    </details>
  );
}
