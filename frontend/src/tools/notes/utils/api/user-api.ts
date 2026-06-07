import type { UserStatistics } from "../../types/statistics-types";
import { ApiClient } from "./client";

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface UserProfile {
  email: string;
  username: string;
}

export class UserApiClient extends ApiClient {
  async getUserProfile(): Promise<UserProfile> {
    try {
      const response = await this.makeRequest(`${this.apiBaseUrl}/auth/me/`, {
        method: "GET",
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Not authenticated");
        }
        throw new Error("Failed to fetch user profile");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching user profile:", error);
      this.handleError(error, "Failed to fetch user profile");
    }
  }

  async getUserStatistics(): Promise<UserStatistics> {
    try {
      const response = await this.makeRequest(`${this.apiBaseUrl}/notes/statistics/`, {
        method: "GET",
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Not authenticated");
        }
        if (response.status === 403) {
          throw new Error("You don't have permission to access statistics");
        }
        throw new Error("Failed to fetch user statistics");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching user statistics:", error);
      this.handleError(error, "Failed to fetch user statistics");
    }
  }

  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.makeRequest(`${this.apiBaseUrl}/auth/change-password/`, {
        method: "POST",
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to change password");
      }

      return data;
    } catch (error) {
      console.error("Change password error:", error);
      this.handleError(error, "Failed to change password");
    }
  }
}
