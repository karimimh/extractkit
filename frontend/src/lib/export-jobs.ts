const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

export type ExportJob = {
  id: string;
  tool: string;
  status: "pending" | "running" | "completed" | "failed";
  title: string;
  error: string;
  response_status: number | null;
  result: unknown;
  download_url: string | null;
  schedule_id: string | null;
  webhook_status: number | null;
  webhook_error: string;
  webhook_delivered_at: string | null;
  created_at: string;
  finished_at: string | null;
};

export type ExportSchedule = {
  id: string;
  name: string;
  tool: string;
  endpoint: string;
  payload: unknown;
  frequency: "hourly" | "daily" | "weekly" | "monthly";
  webhook_url: string;
  webhook_configured: boolean;
  webhook_secret?: string;
  is_active: boolean;
  next_run_at: string;
  last_run_at: string | null;
  created_at: string;
};

function authHeaders(token?: string | null) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function runExportJob(endpoint: string, payload: unknown, token?: string | null) {
  const submitted = await fetch(`${API_BASE_URL}/api/jobs/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify({ endpoint, payload }),
  });
  if (!submitted.ok) return submitted;

  let job = (await submitted.json()) as ExportJob;
  window.dispatchEvent(new CustomEvent("export-job-updated", { detail: job }));
  while (job.status === "pending" || job.status === "running") {
    await new Promise((resolve) => window.setTimeout(resolve, 1200));
    const response = await fetch(`${API_BASE_URL}/api/jobs/${job.id}/`, {
      headers: authHeaders(token),
    });
    if (!response.ok) return response;
    job = (await response.json()) as ExportJob;
    window.dispatchEvent(new CustomEvent("export-job-updated", { detail: job }));
  }

  const body = job.status === "completed" ? job.result : { detail: job.error || "Export failed." };
  return new Response(JSON.stringify(body), {
    status: job.status === "completed" ? job.response_status ?? 200 : job.response_status ?? 500,
    headers: { "Content-Type": "application/json" },
  });
}

export async function listExportJobs(token: string) {
  const response = await fetch(`${API_BASE_URL}/api/jobs/`, { headers: authHeaders(token) });
  if (!response.ok) throw new Error("Could not load export history.");
  return (await response.json()) as ExportJob[];
}

export async function rerunExportJob(id: string, token: string) {
  const response = await fetch(`${API_BASE_URL}/api/jobs/${id}/rerun/`, {
    method: "POST",
    headers: authHeaders(token),
  });
  if (!response.ok) throw new Error("Could not rerun export.");
  const job = (await response.json()) as ExportJob;
  window.dispatchEvent(new CustomEvent("export-job-updated", { detail: job }));
  return job;
}

export function exportJobDownloadUrl(job: ExportJob) {
  return `${API_BASE_URL}${job.download_url}`;
}

export async function listExportSchedules(token: string) {
  const response = await fetch(`${API_BASE_URL}/api/schedules/`, { headers: authHeaders(token) });
  if (!response.ok) throw new Error("Could not load export schedules.");
  return (await response.json()) as ExportSchedule[];
}

export async function createExportSchedule(
  sourceJobId: string,
  values: { name: string; frequency: ExportSchedule["frequency"]; next_run_at: string; webhook_url: string },
  token: string,
) {
  const response = await fetch(`${API_BASE_URL}/api/schedules/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify({ source_job_id: sourceJobId, ...values }),
  });
  if (!response.ok) throw new Error((await response.json()).detail || "Could not create schedule.");
  return (await response.json()) as ExportSchedule;
}

export async function updateExportSchedule(id: string, values: Partial<ExportSchedule>, token: string) {
  const response = await fetch(`${API_BASE_URL}/api/schedules/${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(values),
  });
  if (!response.ok) throw new Error("Could not update schedule.");
  return (await response.json()) as ExportSchedule;
}

export async function deleteExportSchedule(id: string, token: string) {
  const response = await fetch(`${API_BASE_URL}/api/schedules/${id}/`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!response.ok) throw new Error("Could not delete schedule.");
}
