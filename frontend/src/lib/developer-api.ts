const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

export type DeveloperAPIKey = {
  id: string;
  name: string;
  prefix: string;
  key?: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
};

export type DeveloperUsage = {
  period_days: number;
  total_jobs: number;
  successful_jobs: number;
  failed_jobs: number;
  active_jobs: number;
  by_tool: { tool: string; count: number }[];
  daily: { date: string; count: number }[];
};

function headers(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function listDeveloperKeys(token: string) {
  const response = await fetch(`${API_BASE_URL}/api/developer/keys/`, { headers: headers(token) });
  if (!response.ok) throw new Error("Could not load API keys.");
  return (await response.json()) as DeveloperAPIKey[];
}

export async function createDeveloperKey(name: string, token: string) {
  const response = await fetch(`${API_BASE_URL}/api/developer/keys/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers(token) },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) throw new Error((await response.json()).detail || "Could not create API key.");
  return (await response.json()) as DeveloperAPIKey;
}

export async function revokeDeveloperKey(id: string, token: string) {
  const response = await fetch(`${API_BASE_URL}/api/developer/keys/${id}/`, {
    method: "DELETE",
    headers: headers(token),
  });
  if (!response.ok) throw new Error("Could not revoke API key.");
}

export async function getDeveloperUsage(token: string) {
  const response = await fetch(`${API_BASE_URL}/api/developer/usage/`, { headers: headers(token) });
  if (!response.ok) throw new Error("Could not load API usage.");
  return (await response.json()) as DeveloperUsage;
}

export { API_BASE_URL };
