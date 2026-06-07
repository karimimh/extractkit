import Dialog from "@notes/ui/dialog/dialog";
import { apiClient } from "@notes/utils/api";
import { MessageCircle, RefreshCw, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { SupportTicket, SupportTicketListItem } from "@notes/types/support-types";

interface SupportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const SupportDialog: React.FC<SupportDialogProps> = ({ isOpen, onOpenChange }) => {
  const [tickets, setTickets] = useState<SupportTicketListItem[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [newTicketSubject, setNewTicketSubject] = useState("");
  const [newTicketMessage, setNewTicketMessage] = useState("");
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (selectedTicket) {
      scrollToBottom();
    }
  }, [selectedTicket?.messages]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const data = await apiClient.support.getSupportTickets();
      setTickets(data);
      if (data.length === 0) {
        setShowNewTicketForm(true);
      }
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketDetails = async (ticketId: number) => {
    setLoading(true);
    try {
      const data = await apiClient.support.getSupportTicket(ticketId);
      setSelectedTicket(data);
    } catch (error) {
      console.error("Failed to fetch ticket details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTickets();
      setSelectedTicket(null);
      setShowNewTicketForm(false);
      setMessageText("");
      setNewTicketSubject("");
      setNewTicketMessage("");
    }
  }, [isOpen]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketMessage.trim()) return;

    setSending(true);
    try {
      const ticket = await apiClient.support.createSupportTicket({
        subject: newTicketSubject.trim() || undefined,
        message: newTicketMessage.trim(),
      });
      setShowNewTicketForm(false);
      setNewTicketSubject("");
      setNewTicketMessage("");
      await fetchTickets();
      setSelectedTicket(ticket);
    } catch (error) {
      console.error("Failed to create ticket:", error);
    } finally {
      setSending(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedTicket) return;

    setSending(true);
    try {
      await apiClient.support.sendSupportMessage(selectedTicket.id, {
        message: messageText.trim(),
      });
      setMessageText("");
      await fetchTicketDetails(selectedTicket.id);
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSending(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket) return;

    try {
      await apiClient.support.closeSupportTicket(selectedTicket.id);
      await fetchTicketDetails(selectedTicket.id);
      await fetchTickets();
    } catch (error) {
      console.error("Failed to close ticket:", error);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange} mobileVariant="fullscreen">
      <Dialog.Content className="max-w-4xl sm:h-[600px] relative">
        <Dialog.Content.Header className="shadow-sm font-bold z-20 text-[var(--text-primary)]">
          Customer Support
        </Dialog.Content.Header>

        <div className="flex h-[calc(100%-60px)] mt-2 mx-2 mb-2">
          {/* Tickets List */}
          <div className="w-1/3 border-r border-[var(--border-primary)] pr-3 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Your Tickets</h3>
              <button
                onClick={() => setShowNewTicketForm(true)}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
              >
                New Ticket
              </button>
            </div>

            {loading && !selectedTicket && (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
              </div>
            )}

            <div className="flex-1 overflow-y-auto space-y-2">
              {tickets.map(ticket => (
                <div
                  key={ticket.id}
                  onClick={() => {
                    fetchTicketDetails(ticket.id);
                    setShowNewTicketForm(false);
                  }}
                  className={`p-3 rounded cursor-pointer border ${
                    selectedTicket?.id === ticket.id
                      ? "bg-blue-500/10 border-blue-500/30"
                      : "bg-[var(--bg-secondary)] border-[var(--border-primary)] hover:bg-[var(--bg-tertiary)]"
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-xs font-medium text-[var(--text-primary)]">
                      #{ticket.id}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        ticket.status === "open"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {ticket.status}
                    </span>
                  </div>
                  {ticket.subject && (
                    <div className="text-sm font-medium text-[var(--text-primary)] mb-1 truncate">
                      {ticket.subject}
                    </div>
                  )}
                  {ticket.last_message && (
                    <div className="text-xs text-[var(--text-secondary)] truncate">
                      {ticket.last_message.message}
                    </div>
                  )}
                  <div className="text-xs text-[var(--text-tertiary)] mt-1">
                    {formatDate(ticket.updated_at)}
                  </div>
                </div>
              ))}

              {!loading && tickets.length === 0 && !showNewTicketForm && (
                <div className="text-center py-8 text-[var(--text-secondary)] text-sm">
                  No tickets yet. Create one to get started.
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 pl-3 flex flex-col">
            {showNewTicketForm ? (
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                    New Support Ticket
                  </h3>
                  <button
                    onClick={() => setShowNewTicketForm(false)}
                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateTicket} className="flex flex-col flex-1">
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                      Subject (Optional)
                    </label>
                    <input
                      type="text"
                      value={newTicketSubject}
                      onChange={e => setNewTicketSubject(e.target.value)}
                      placeholder="Brief description of your issue"
                      className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
                    />
                  </div>

                  <div className="flex-1 flex flex-col mb-3">
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                      Message
                    </label>
                    <textarea
                      value={newTicketMessage}
                      onChange={e => setNewTicketMessage(e.target.value)}
                      placeholder="Describe your issue in detail..."
                      className="flex-1 px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] resize-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={sending || !newTicketMessage.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded flex items-center justify-center"
                  >
                    {sending ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Create Ticket
                      </>
                    )}
                  </button>
                </form>
              </div>
            ) : selectedTicket ? (
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-[var(--border-primary)]">
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                      Ticket #{selectedTicket.id}
                    </h3>
                    {selectedTicket.subject && (
                      <p className="text-sm text-[var(--text-secondary)]">
                        {selectedTicket.subject}
                      </p>
                    )}
                  </div>
                  {selectedTicket.status === "open" && (
                    <button
                      onClick={handleCloseTicket}
                      className="text-xs bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded"
                    >
                      Close Ticket
                    </button>
                  )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-3 mb-3">
                  {selectedTicket.messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.is_admin ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          msg.is_admin
                            ? "bg-blue-500/20 border border-blue-500/30"
                            : "bg-[var(--bg-secondary)] border border-[var(--border-primary)]"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-[var(--text-primary)]">
                            {msg.sender_username}
                            {msg.is_admin && <span className="ml-1 text-blue-400">(Support)</span>}
                          </span>
                          <span className="text-xs text-[var(--text-tertiary)]">
                            {formatDate(msg.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">
                          {msg.message}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                {selectedTicket.status === "open" && (
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                      type="text"
                      value={messageText}
                      onChange={e => setMessageText(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
                    />
                    <button
                      type="submit"
                      disabled={sending || !messageText.trim()}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded flex items-center"
                    >
                      {sending ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                  </form>
                )}

                {selectedTicket.status === "closed" && (
                  <div className="bg-gray-500/20 border border-gray-500/30 rounded p-3 text-center text-sm text-[var(--text-secondary)]">
                    This ticket is closed. Create a new ticket if you need further assistance.
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-[var(--text-secondary)]">
                Select a ticket to view conversation
              </div>
            )}
          </div>
        </div>
      </Dialog.Content>
    </Dialog>
  );
};

export default SupportDialog;
