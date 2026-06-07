import type {
  LabelsResponse,
  Label,
  CreateLabelData,
  UpdateLabelData,
} from "../../types/label-types";
import { ApiClient } from "./client";

export class LabelsApiClient extends ApiClient {
  async fetchLabels(): Promise<LabelsResponse> {
    try {
      const response = await this.makeRequest(`${this.apiBaseUrl}/notes/labels/`, {
        method: "GET",
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Not authenticated");
        }
        if (response.status === 403) {
          throw new Error("You don't have permission to access labels");
        }
        throw new Error("Failed to fetch labels");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching labels:", error);
      this.handleError(error, "Failed to fetch labels");
    }
  }

  async createLabel(labelData: CreateLabelData): Promise<Label> {
    try {
      const response = await this.makeRequest(`${this.apiBaseUrl}/notes/labels/`, {
        method: "POST",
        body: JSON.stringify(labelData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Not authenticated");
        }
        if (response.status === 403) {
          throw new Error("You don't have permission to create labels");
        }
        const errorData = await response.json().catch(() => ({
          error: "Failed to create label",
        }));
        throw new Error(errorData.error || "Failed to create label");
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating label:", error);
      this.handleError(error, "Failed to create label");
    }
  }

  async updateLabel(labelId: number, labelData: UpdateLabelData): Promise<Label> {
    try {
      const response = await this.makeRequest(`${this.apiBaseUrl}/notes/labels/${labelId}/`, {
        method: "PUT",
        body: JSON.stringify(labelData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Not authenticated");
        }
        if (response.status === 403) {
          throw new Error("You don't have permission to update this label");
        }
        const errorData = await response.json().catch(() => ({
          error: "Failed to update label",
        }));
        throw new Error(errorData.error || "Failed to update label");
      }

      return await response.json();
    } catch (error) {
      console.error("Error updating label:", error);
      this.handleError(error, "Failed to update label");
    }
  }

  async deleteLabel(labelId: number): Promise<void> {
    try {
      const response = await this.makeRequest(`${this.apiBaseUrl}/notes/labels/${labelId}/`, {
        method: "DELETE",
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Not authenticated");
        }
        if (response.status === 403) {
          throw new Error("You don't have permission to delete this label");
        }
        const errorData = await response.json().catch(() => ({
          error: "Failed to delete label",
        }));
        throw new Error(errorData.error || "Failed to delete label");
      }
    } catch (error) {
      console.error("Error deleting label:", error);
      this.handleError(error, "Failed to delete label");
    }
  }
}
