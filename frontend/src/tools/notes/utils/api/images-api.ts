import type { UserImagesResponse } from "../../types/image-types";
import { ApiClient } from "./client";

export interface ImageUploadData {
  image: File;
  alt_text?: string;
}

export interface ImageUploadResponse {
  id: number;
  image: string;
  alt_text: string;
  uploaded_at: string;
}

export class ImagesApiClient extends ApiClient {
  async uploadImage(noteId: number, imageData: ImageUploadData): Promise<ImageUploadResponse> {
    try {
      const formData = new FormData();
      formData.append("image", imageData.image);
      if (imageData.alt_text) {
        formData.append("alt_text", imageData.alt_text);
      }

      const response = await this.makeRequest(`${this.apiBaseUrl}/notes/${noteId}/images/`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Not authenticated");
        }
        if (response.status === 403) {
          throw new Error("You don't have permission to upload images");
        }
        const errorData = await response.json().catch(() => ({
          error: "Failed to upload image",
        }));
        throw new Error(errorData.error || "Failed to upload image");
      }

      return await response.json();
    } catch (error) {
      console.error("Error uploading image:", error);
      this.handleError(error, "Failed to upload image");
    }
  }

  async getUserImages(): Promise<UserImagesResponse> {
    try {
      const response = await this.makeRequest(`${this.apiBaseUrl}/notes/images/`, {
        method: "GET",
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Not authenticated");
        }
        throw new Error("Failed to fetch uploaded images");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching uploaded images:", error);
      this.handleError(error, "Failed to fetch uploaded images");
    }
  }
}
