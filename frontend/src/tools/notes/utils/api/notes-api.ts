import type { NotesResponse, Note, NoteHistoryEntry } from "../../types/note-types";
import { ApiClient } from "./client";

export interface CreateNoteData {
  title?: string;
  content: string;
  content_type: "text" | "markdown";
  labels?: number[];
  color: string;
  bg_color: string;
}

export interface UpdateNoteData {
  title?: string;
  content?: string;
  content_type?: "text" | "markdown";
  labels?: number[];
  color?: string;
  bg_color?: string;
}

export interface FetchNotesParams {
  searchQuery?: string;
  orderBy?: "updated_at" | "created_at" | "title" | "content_type" | "color" | "bg_color" | "order";
  orderDirection?: "asc" | "desc";
  page?: number;
  page_size?: number;
  color?: string;
  bg_color?: string;
  labels?: string;
}

export interface NotesVersionResponse {
  version: string | null;
  count: number;
}

export class NotesApiClient extends ApiClient {
  async fetchNotes(params?: FetchNotesParams): Promise<NotesResponse> {
    try {
      const url = new URL(`${this.apiBaseUrl}/notes/`);
      if (params?.searchQuery && params.searchQuery.trim()) {
        url.searchParams.append("search", params.searchQuery.trim());
      }
      if (params?.orderBy) {
        url.searchParams.append("order_by", params.orderBy);
      }
      if (params?.orderDirection) {
        url.searchParams.append("order_direction", params.orderDirection);
      }
      if (params?.page) {
        url.searchParams.append("page", params.page.toString());
      }
      if (params?.page_size) {
        url.searchParams.append("page_size", params.page_size.toString());
      }
      if (params?.color) {
        url.searchParams.append("color", params.color);
      }
      if (params?.bg_color) {
        url.searchParams.append("bg_color", params.bg_color);
      }
      if (params?.labels) {
        url.searchParams.append("labels", params.labels);
      }

      const response = await this.makeRequest(url.toString(), { method: "GET" });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Not authenticated");
        }
        if (response.status === 403) {
          throw new Error("You don't have permission to access these notes");
        }
        throw new Error("Failed to fetch notes");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching notes:", error);
      this.handleError(error, "Failed to fetch notes");
    }
  }

  async fetchNotesVersion(): Promise<NotesVersionResponse> {
    try {
      const response = await this.makeRequest(`${this.apiBaseUrl}/notes/version/`, {
        method: "GET",
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Not authenticated");
        }
        throw new Error("Failed to fetch notes version");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching notes version:", error);
      throw error;
    }
  }

  async createNote(noteData: CreateNoteData): Promise<Note> {
    try {
      const response = await this.makeRequest(`${this.apiBaseUrl}/notes/`, {
        method: "POST",
        body: JSON.stringify(noteData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Not authenticated");
        }
        if (response.status === 403) {
          throw new Error("You don't have permission to create notes");
        }
        const errorData = await response.json().catch(() => ({
          error: "Failed to create note",
        }));
        throw new Error(errorData.error || "Failed to create note");
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating note:", error);
      this.handleError(error, "Failed to create note");
    }
  }

  async updateNote(noteId: number, noteData: UpdateNoteData): Promise<Note> {
    try {
      const response = await this.makeRequest(`${this.apiBaseUrl}/notes/${noteId}/`, {
        method: "PUT",
        body: JSON.stringify(noteData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Not authenticated");
        }
        if (response.status === 403) {
          throw new Error("You don't have permission to update this note");
        }
        const errorData = await response.json().catch(() => ({
          error: "Failed to update note",
        }));
        throw new Error(errorData.error || "Failed to update note");
      }

      return await response.json();
    } catch (error) {
      console.error("Error updating note:", error);
      this.handleError(error, "Failed to update note");
    }
  }

  async deleteNote(noteId: number): Promise<void> {
    try {
      const response = await this.makeRequest(`${this.apiBaseUrl}/notes/${noteId}/`, {
        method: "DELETE",
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Not authenticated");
        }
        if (response.status === 403) {
          throw new Error("You don't have permission to delete this note");
        }
        const errorData = await response.json().catch(() => ({
          error: "Failed to delete note",
        }));
        throw new Error(errorData.error || "Failed to delete note");
      }
    } catch (error) {
      console.error("Error deleting note:", error);
      this.handleError(error, "Failed to delete note");
    }
  }

  async pinNote(
    noteId: number
  ): Promise<{ id: number; is_pinned: boolean; pin_order: number; message: string }> {
    try {
      const response = await this.makeRequest(`${this.apiBaseUrl}/notes/${noteId}/pin/`, {
        method: "POST",
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Not authenticated");
        }
        const errorData = await response.json().catch(() => ({
          error: "Failed to pin/unpin note",
        }));
        throw new Error(errorData.error || "Failed to pin/unpin note");
      }

      return await response.json();
    } catch (error) {
      console.error("Error pinning/unpinning note:", error);
      throw error;
    }
  }

  async fetchNoteHistory(noteId: number): Promise<NoteHistoryEntry[]> {
    try {
      const response = await this.makeRequest(`${this.apiBaseUrl}/notes/${noteId}/history/`, {
        method: "GET",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch note history");
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching note history:", error);
      this.handleError(error, "Failed to fetch note history");
    }
  }

  async restoreNoteHistory(noteId: number, historyId: number): Promise<Note> {
    try {
      const response = await this.makeRequest(
        `${this.apiBaseUrl}/notes/${noteId}/history/${historyId}/restore/`,
        { method: "POST" }
      );
      if (!response.ok) {
        throw new Error("Failed to restore note history");
      }
      return await response.json();
    } catch (error) {
      console.error("Error restoring note history:", error);
      this.handleError(error, "Failed to restore note history");
    }
  }

  async reorderNote(draggedId: number, targetId: number): Promise<{ message: string }> {
    try {
      const response = await this.makeRequest(`${this.apiBaseUrl}/notes/bulk-order/`, {
        method: "POST",
        body: JSON.stringify({ dragged_id: draggedId, target_id: targetId }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Not authenticated");
        }
        if (response.status === 403) {
          throw new Error("You don't have permission to reorder notes");
        }
        const errorData = await response.json().catch(() => ({
          error: "Failed to reorder note",
        }));
        throw new Error(errorData.error || "Failed to reorder note");
      }

      return await response.json();
    } catch (error) {
      console.error("Error reordering note:", error);
      this.handleError(error, "Failed to reorder note");
    }
  }

  async downloadNote(noteId: number, format: "txt" | "md" | "pdf"): Promise<void> {
    try {
      const response = await this.makeRequest(
        `${this.apiBaseUrl}/notes/download/${noteId}/?download_format=${format}`,
        {
          method: "GET",
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Not authenticated");
        }
        if (response.status === 403) {
          throw new Error("You don't have permission to download this note");
        }
        throw new Error(`Download failed: ${response.statusText}`);
      }

      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `note-${noteId}.${format}`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading note:", error);
      this.handleError(error, "Failed to download note");
    }
  }
}
