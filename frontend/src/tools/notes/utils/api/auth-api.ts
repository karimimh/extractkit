import { ApiClient, type ApiResponse } from "./client";

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
}

export interface VerifyEmailData {
  email: string;
  code: string;
}

export interface ResendCodeData {
  email: string;
}

export interface ResetPasswordData {
  email: string;
  code: string;
  new_password: string;
}

export class AuthApiClient extends ApiClient {
  async login(loginData: LoginData): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginData.email, password: loginData.password }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ detail: "Login failed" }));
        throw new Error(data.detail || data.message || "Invalid email or password");
      }

      const data = await response.json();
      localStorage.setItem("access_token", data.access as string);
      localStorage.setItem("refresh_token", data.refresh as string);
      window.dispatchEvent(new StorageEvent("storage", { key: "access_token", newValue: data.access as string }));
      return { success: true, message: "Logged in successfully" };
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  async register(registerData: RegisterData): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registerData.email, password: registerData.password }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ detail: "Registration failed" }));
        throw new Error(data.detail || data.message || "Registration failed");
      }

      const data = await response.json();
      if (data.access) {
        localStorage.setItem("access_token", data.access as string);
        if (data.refresh) localStorage.setItem("refresh_token", data.refresh as string);
        window.dispatchEvent(new StorageEvent("storage", { key: "access_token", newValue: data.access as string }));
      }
      return { success: true, message: data.message || "Registered successfully", needs_verification: false };
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  }

  async verifyEmail(_verifyData: VerifyEmailData): Promise<ApiResponse> {
    return { success: true, message: "Email verified" };
  }

  async resendCode(_email: string): Promise<ApiResponse> {
    return { success: true, message: "Code resent" };
  }

  async forgotPassword(email: string): Promise<ApiResponse> {
    try {
      return await this.makeAuthenticatedRequest(`${this.apiBaseUrl}/auth/forgot-password/`, { email });
    } catch (error) {
      console.error("Forgot password error:", error);
      throw error;
    }
  }

  async resetPassword(email: string, code: string, newPassword: string): Promise<ApiResponse> {
    try {
      return await this.makeAuthenticatedRequest(`${this.apiBaseUrl}/auth/reset-password/`, {
        email,
        code,
        new_password: newPassword,
      });
    } catch (error) {
      console.error("Reset password error:", error);
      throw error;
    }
  }

  async logout(): Promise<ApiResponse> {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.dispatchEvent(new StorageEvent("storage", { key: "access_token", newValue: null }));
    return { success: true, message: "Logged out" };
  }

  async checkAuthStatus(): Promise<boolean> {
    const token = localStorage.getItem("access_token");
    if (!token) return false;
    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/me/`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) return true;
      if (response.status === 401) {
        const refresh = localStorage.getItem("refresh_token");
        if (refresh) {
          const r = await fetch(`${this.apiBaseUrl}/auth/refresh/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh }),
          });
          if (r.ok) {
            const d = await r.json();
            localStorage.setItem("access_token", d.access as string);
            return true;
          }
        }
      }
      return false;
    } catch {
      return false;
    }
  }
}

