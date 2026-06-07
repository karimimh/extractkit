import { ApiClient } from "./client";

export interface SummarizeNoteResponse {
  summary: string;
  note_id: number;
}

export interface TranslateNoteResponse {
  translated_content: string;
  target_language: string;
  note_id: number;
}

export interface GenerateNoteResponse {
  content: string;
  prompt: string;
  note_id?: number;
}

export interface AIAssistantMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AIAssistantActionResult {
  success: boolean;
  message: string;
  note_id?: number;
  action_type?: string;
}

export interface AIAssistantResponse {
  response: string;
  actions: AIAssistantActionResult[];
  stats: {
    total_notes: number;
    pinned_notes: number;
    active_notes: number;
    label_count: number;
    storage_used_mb: number;
  };
}

export class AIApiClient extends ApiClient {
  async summarizeNote(noteId: number): Promise<SummarizeNoteResponse> {
    try {
      const response = await this.makeRequest(`${this.apiBaseUrl}/notes/${noteId}/summarize/`, {
        method: "POST",
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Not authenticated");
        }
        if (response.status === 403) {
          throw new Error("You don't have permission to summarize this note");
        }
        const errorData = await response.json().catch(() => ({
          error: "Failed to summarize note",
        }));
        throw new Error(errorData.error || "Failed to summarize note");
      }

      return await response.json();
    } catch (error) {
      console.error("Error summarizing note:", error);
      this.handleError(error, "Failed to summarize note");
    }
  }

  async translateNote(noteId: number, targetLanguage: string): Promise<TranslateNoteResponse> {
    try {
      const response = await this.makeRequest(`${this.apiBaseUrl}/notes/${noteId}/translate/`, {
        method: "POST",
        body: JSON.stringify({ target_language: targetLanguage }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Not authenticated");
        }
        if (response.status === 403) {
          throw new Error("You don't have permission to translate this note");
        }
        const errorData = await response.json().catch(() => ({
          error: "Failed to translate note",
        }));
        throw new Error(errorData.error || "Failed to translate note");
      }

      return await response.json();
    } catch (error) {
      console.error("Error translating note:", error);
      this.handleError(error, "Failed to translate note");
    }
  }

  async generateNote(prompt: string, noteId?: number): Promise<GenerateNoteResponse> {
    try {
      const body: { prompt: string; note_id?: number } = { prompt };
      if (noteId) {
        body.note_id = noteId;
      }

      const response = await this.makeRequest(`${this.apiBaseUrl}/notes/generate/`, {
        method: "POST",
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Not authenticated");
        }
        if (response.status === 403) {
          throw new Error("You don't have permission to generate notes");
        }
        const errorData = await response.json().catch(() => ({
          error: "Failed to generate note",
        }));
        throw new Error(errorData.error || "Failed to generate note");
      }

      return await response.json();
    } catch (error) {
      console.error("Error generating note:", error);
      this.handleError(error, "Failed to generate note");
    }
  }

  async sendAIAssistantMessage(
    message: string,
    conversationHistory: AIAssistantMessage[]
  ): Promise<AIAssistantResponse> {
    try {
      const response = await this.makeRequest(`${this.apiBaseUrl}/notes/assistant/`, {
        method: "POST",
        body: JSON.stringify({
          message,
          conversation_history: conversationHistory,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Not authenticated");
        }
        if (response.status === 403) {
          const errorData = await response.json().catch(() => ({
            detail: "AI Assistant is a Pro feature. Upgrade to access it.",
          }));
          throw new Error(errorData.detail || "AI Assistant is a Pro feature");
        }
        const errorData = await response.json().catch(() => ({
          error: "Failed to send message",
        }));
        throw new Error(errorData.error || "Failed to send message");
      }

      return await response.json();
    } catch (error) {
      console.error("Error sending AI assistant message:", error);
      throw error;
    }
  }
}
