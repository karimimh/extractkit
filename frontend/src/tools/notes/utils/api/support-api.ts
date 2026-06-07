import type {
  SupportTicket,
  SupportTicketListItem,
  CreateTicketData,
  SendMessageData,
} from "../../types/support-types";
import { ApiClient } from "./client";

export class SupportApiClient extends ApiClient {
  async getSupportTickets(): Promise<SupportTicketListItem[]> {
    try {
      const response = await this.makeRequest(`${this.apiBaseUrl}/support/tickets/`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch support tickets");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching support tickets:", error);
      this.handleError(error, "Failed to fetch support tickets");
    }
  }

  async getSupportTicket(id: number): Promise<SupportTicket> {
    try {
      const response = await this.makeRequest(`${this.apiBaseUrl}/support/tickets/${id}/`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch support ticket");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching support ticket:", error);
      this.handleError(error, "Failed to fetch support ticket");
    }
  }

  async createSupportTicket(data: CreateTicketData): Promise<SupportTicket> {
    try {
      const response = await this.makeRequest(`${this.apiBaseUrl}/support/tickets/`, {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: "Failed to create support ticket",
        }));
        throw new Error(errorData.error || "Failed to create support ticket");
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating support ticket:", error);
      this.handleError(error, "Failed to create support ticket");
    }
  }

  async sendSupportMessage(
    ticketId: number,
    data: SendMessageData
  ): Promise<{ id: number; message: string; created_at: string; is_admin: boolean }> {
    try {
      const response = await this.makeRequest(
        `${this.apiBaseUrl}/support/tickets/${ticketId}/send_message/`,
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: "Failed to send message",
        }));
        throw new Error(errorData.error || "Failed to send message");
      }

      return await response.json();
    } catch (error) {
      console.error("Error sending message:", error);
      this.handleError(error, "Failed to send message");
    }
  }

  async closeSupportTicket(ticketId: number): Promise<SupportTicket> {
    try {
      const response = await this.makeRequest(
        `${this.apiBaseUrl}/support/tickets/${ticketId}/close_ticket/`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to close ticket");
      }

      return await response.json();
    } catch (error) {
      console.error("Error closing ticket:", error);
      this.handleError(error, "Failed to close ticket");
    }
  }
}
