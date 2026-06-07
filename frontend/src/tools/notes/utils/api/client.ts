import { showError } from "../toast-handler";

export const getBackendBaseUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/api\/?$/, "");
  }
  return `${window.location.origin}`;
};

export const getApiBaseUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  return `${window.location.origin}/api`;
};

export interface ApiResponse {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
  needs_verification?: boolean;
  email?: string;
  wait_time?: number;
}

export class ApiClient {
  protected apiBaseUrl: string;

  constructor() {
    this.apiBaseUrl = getApiBaseUrl();
  }

  protected handleError(error: unknown, defaultMessage: string, showToast = true): never {
    const message = error instanceof Error ? error.message : defaultMessage;

    if (showToast) {
      if (message.includes("Not authenticated") || message.includes("401")) {
        showError("Please log in to continue");
      } else if (message.includes("403") || message.includes("permission")) {
        showError("You don't have permission to perform this action");
      } else {
        showError(message);
      }
    }

    throw error;
  }

  private async refreshAccessToken(): Promise<string | null> {
    const refresh = localStorage.getItem("refresh_token");
    if (!refresh) return null;
    try {
      const res = await fetch(`${this.apiBaseUrl}/auth/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });
      if (!res.ok) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        return null;
      }
      const data = await res.json();
      localStorage.setItem("access_token", data.access as string);
      return data.access as string;
    } catch {
      return null;
    }
  }

  protected async makeRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const token = localStorage.getItem("access_token");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string>),
    };

    if (options.body instanceof FormData) {
      delete headers["Content-Type"];
    }

    let response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
      const newToken = await this.refreshAccessToken();
      if (newToken) {
        response = await fetch(url, {
          ...options,
          headers: { ...headers, Authorization: `Bearer ${newToken}` },
        });
      }
    }

    return response;
  }

  protected async makeAuthenticatedRequest(url: string, data: unknown): Promise<ApiResponse> {
    const token = localStorage.getItem("access_token");
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        success: false,
        message: "An error occurred",
      }));

      if (errorData.needs_verification) {
        return errorData;
      }

      throw new Error(errorData.message || errorData.detail || "Request failed");
    }

    return await response.json();
  }
}
