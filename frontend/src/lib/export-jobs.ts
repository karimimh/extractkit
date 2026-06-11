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
  created_at: string;
  finished_at: string | null;
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
