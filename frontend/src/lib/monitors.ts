const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

export type MonitorChange = {
  id: string;
  summary: string;
  changed_percent: number;
  diff: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  before_image_url: string | null;
  after_image_url: string | null;
  diff_image_url: string | null;
  created_at: string;
};

export type MonitorSnapshot = {
  id: number;
  title: string;
  data: Record<string, unknown>;
  image_url: string | null;
  created_at: string;
};

export type WebpageMonitor = {
  id: string;
  name: string;
  url: string;
  mode: "text" | "selected" | "structured" | "visual";
  selectors: string[];
  fields: string[];
  ignore_selectors: string[];
  ignore_patterns: string[];
  ignore_whitespace: boolean;
  ignore_case: boolean;
  ignore_numbers: boolean;
  minimum_change_percent: number;
  ai_cleanup: boolean;
  frequency: "minutely" | "hourly" | "daily" | "weekly" | "monthly";
  webhook_url: string;
  webhook_configured: boolean;
  webhook_secret?: string;
  notify_email: boolean;
  is_active: boolean;
  is_running: boolean;
  next_run_at: string;
  last_run_at: string | null;
  last_changed_at: string | null;
  last_error: string;
  latest_change: MonitorChange | null;
  created_at: string;
};

function headers(token: string, json = false) {
  return { ...(json ? { "Content-Type": "application/json" } : {}), Authorization: `Bearer ${token}` };
}

export async function listMonitors(token: string) {
  const response = await fetch(`${API_BASE_URL}/api/monitors/`, { headers: headers(token) });
  if (!response.ok) throw new Error("Could not load monitors.");
  return (await response.json()) as WebpageMonitor[];
}

export async function createMonitor(values: Record<string, unknown>, token: string) {
  const response = await fetch(`${API_BASE_URL}/api/monitors/`, {
    method: "POST",
    headers: headers(token, true),
    body: JSON.stringify(values),
  });
  if (!response.ok) throw new Error((await response.json()).detail || "Could not create monitor.");
  return (await response.json()) as WebpageMonitor;
}

export async function updateMonitor(id: string, values: Partial<WebpageMonitor>, token: string) {
  const response = await fetch(`${API_BASE_URL}/api/monitors/${id}/`, {
    method: "PATCH",
    headers: headers(token, true),
    body: JSON.stringify(values),
  });
  if (!response.ok) throw new Error((await response.json()).detail || "Could not update monitor.");
  return (await response.json()) as WebpageMonitor;
}

export async function deleteMonitor(id: string, token: string) {
  const response = await fetch(`${API_BASE_URL}/api/monitors/${id}/`, {
    method: "DELETE",
    headers: headers(token),
  });
  if (!response.ok) throw new Error("Could not delete monitor.");
}

export async function runMonitor(id: string, token: string) {
  const response = await fetch(`${API_BASE_URL}/api/monitors/${id}/run/`, {
    method: "POST",
    headers: headers(token),
  });
  if (!response.ok) throw new Error("Could not run monitor.");
}

export async function listMonitorChanges(id: string, token: string) {
  const response = await fetch(`${API_BASE_URL}/api/monitors/${id}/changes/`, { headers: headers(token) });
  if (!response.ok) throw new Error("Could not load monitor changes.");
  return (await response.json()) as MonitorChange[];
}

export async function listMonitorSnapshots(id: string, token: string) {
  const response = await fetch(`${API_BASE_URL}/api/monitors/${id}/snapshots/`, { headers: headers(token) });
  if (!response.ok) throw new Error("Could not load monitor snapshots.");
  return (await response.json()) as MonitorSnapshot[];
}

export async function restoreMonitorSnapshot(monitorId: string, snapshotId: number, token: string) {
  const response = await fetch(`${API_BASE_URL}/api/monitors/${monitorId}/snapshots/${snapshotId}/restore/`, {
    method: "POST",
    headers: headers(token),
  });
  if (!response.ok) throw new Error((await response.json()).detail || "Could not restore snapshot.");
  return (await response.json()) as MonitorSnapshot;
}

export function monitorAssetUrl(path: string | null) {
  if (!path || path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

export function changeDownloadUrl(change: MonitorChange) {
  return `${API_BASE_URL}/api/monitor-changes/${change.id}/download/`;
}
