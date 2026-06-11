import { CalendarClock, Download, History, Pause, Play, RefreshCw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AuthModal } from "../components/auth-modal";
import { useAuth } from "../context/auth-context";
import { usePageSeo } from "../hooks/use-page-seo";
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

export default function ExportHistory() {
  const { token, user } = useAuth();
  usePageSeo({
    title: "Export History – DistillPage",
    description: "Review, download, rerun, and schedule your DistillPage exports.",
    canonical: "https://distillpage.com/export-history",
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [jobs, setJobs] = useState<ExportJob[]>([]);
  const [schedules, setSchedules] = useState<ExportSchedule[]>([]);
  const [sourceJob, setSourceJob] = useState<ExportJob | null>(null);
  const [frequency, setFrequency] = useState<ExportSchedule["frequency"]>("daily");
  const [nextRunAt, setNextRunAt] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [scheduleMessage, setScheduleMessage] = useState("");

  const load = useCallback(async () => {
    if (!token) return setJobs([]);
    try {
      const [jobItems, scheduleItems] = await Promise.all([listExportJobs(token), listExportSchedules(token)]);
      setJobs(jobItems);
      setSchedules(scheduleItems);
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

  const beginSchedule = (job: ExportJob) => {
    const firstRun = new Date(Date.now() + 24 * 60 * 60 * 1000);
    firstRun.setSeconds(0, 0);
    setSourceJob(job);
    const localFirstRun = new Date(firstRun.getTime() - firstRun.getTimezoneOffset() * 60_000);
    setNextRunAt(localFirstRun.toISOString().slice(0, 16));
    setScheduleMessage("");
  };

  const createSchedule = async () => {
    if (!sourceJob || !nextRunAt) return;
    try {
      const created = await createExportSchedule(sourceJob.id, {
        name: sourceJob.title || `${sourceJob.tool.toUpperCase()} export`,
        frequency,
        next_run_at: new Date(nextRunAt).toISOString(),
        webhook_url: webhookUrl,
      }, token);
      setScheduleMessage(created.webhook_secret
        ? `Created. Webhook signing secret: ${created.webhook_secret}`
        : "Schedule created.");
      setSourceJob(null);
      setWebhookUrl("");
      await load();
    } catch (error) {
      setScheduleMessage(error instanceof Error ? error.message : "Could not create schedule.");
    }
  };

  return (
    <main className="app-tool-page min-h-screen">
      <div className="mx-auto w-full max-w-5xl px-4 pb-8 sm:py-8">
        <header className="card-header">
          <h1>Export History</h1>
          <h2 className="subtitle">Download, rerun, and automate your exports</h2>
          <p className="subtitle">Review recent export jobs and manage recurring export schedules from one place.</p>
        </header>
        {!user || !token ? (
          <section className="history-empty-card">
            <History size={24} />
            <p>Sign in to view your export history and schedules.</p>
            <button type="button" className="history-primary-button" onClick={() => setShowAuthModal(true)}>Sign in</button>
          </section>
        ) : (
          <div className="history-page-grid">
            <section className="history-page-section">
              <div className="history-section-heading"><History size={18} /><strong>Recent exports</strong></div>
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
                      <button type="button" onClick={() => beginSchedule(job)}><CalendarClock size={14} /> Schedule</button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
            <section className="history-page-section">
              <div className="history-section-heading"><CalendarClock size={18} /><strong>Schedules</strong></div>
          {sourceJob && (
            <section className="export-schedule-form">
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
            </section>
          )}
          {scheduleMessage && <p className="export-schedule-message">{scheduleMessage}</p>}
              {!schedules.length && !sourceJob && <p className="export-history-empty">No schedules yet. Schedule any export from its history card.</p>}
              {!!schedules.length && (
                <div className="export-schedule-list">
              {schedules.map((schedule) => (
                <article key={schedule.id}>
                  <div className="export-history-row">
                    <strong>{schedule.name || schedule.tool.toUpperCase()}</strong>
                    <span className={`job-status ${schedule.is_active ? "completed" : "failed"}`}>
                      {schedule.is_active ? schedule.frequency : "paused"}
                    </span>
                  </div>
                  <small>Next run: {new Date(schedule.next_run_at).toLocaleString()}{schedule.webhook_configured ? " · webhook" : ""}</small>
                  <div className="export-history-actions">
                    <button type="button" onClick={() => void updateExportSchedule(schedule.id, { is_active: !schedule.is_active }, token).then(() => load())}>
                      {schedule.is_active ? <Pause size={14} /> : <Play size={14} />} {schedule.is_active ? "Pause" : "Resume"}
                    </button>
                    <button type="button" onClick={() => void deleteExportSchedule(schedule.id, token).then(() => load())}><Trash2 size={14} /> Delete</button>
                  </div>
                </article>
              ))}
                </div>
              )}
            </section>
          </div>
        )}
        {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      </div>
    </main>
  );
}
