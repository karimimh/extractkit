export interface SupportMessage {
  id: number;
  ticket: number;
  sender: number;
  sender_username: string;
  sender_email: string;
  message: string;
  is_admin: boolean;
  created_at: string;
}

export interface SupportTicket {
  id: number;
  user: number;
  user_username: string;
  subject: string;
  status: "open" | "closed";
  created_at: string;
  updated_at: string;
  messages: SupportMessage[];
  unread_count?: number;
}

export interface SupportTicketListItem {
  id: number;
  user: number;
  user_username: string;
  subject: string;
  status: "open" | "closed";
  created_at: string;
  updated_at: string;
  last_message: {
    message: string;
    created_at: string;
    is_admin: boolean;
  } | null;
  message_count: number;
}

export interface CreateTicketData {
  subject?: string;
  message: string;
}

export interface SendMessageData {
  message: string;
}
