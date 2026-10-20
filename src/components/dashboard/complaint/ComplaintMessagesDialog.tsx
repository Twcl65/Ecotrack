"use client";

import { Send, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  getComplaintMessages,
  sendAdminComplaintMessage,
  type ComplaintThreadMessage,
} from "@/app/dashboard/complaint/actions";
import type { Complaint } from "@/types/complaint";

type Props = {
  complaint: Complaint | null;
  open: boolean;
  onClose: () => void;
};

export default function ComplaintMessagesDialog({
  complaint,
  open,
  onClose,
}: Props) {
  const [thread, setThread] = useState<{
    complaintId: string;
    messages: ComplaintThreadMessage[];
    error?: string;
  } | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !complaint) return;
    let active = true;
    void getComplaintMessages(complaint.id)
      .then((result) => {
        if (!active) return;
        if (!result.success) {
          setThread({
            complaintId: complaint.id,
            messages: [],
            error: result.error,
          });
          return;
        }
        setThread({ complaintId: complaint.id, messages: result.messages });
      })
      .catch((loadError: unknown) => {
        if (active) {
          setThread({
            complaintId: complaint.id,
            messages: [],
            error:
              loadError instanceof Error
                ? loadError.message
                : "Could not load complaint messages.",
          });
        }
      });

    return () => {
      active = false;
    };
  }, [complaint, open]);

  if (!open || !complaint) return null;
  const activeComplaint = complaint;
  const threadForComplaint =
    thread?.complaintId === activeComplaint.id ? thread : null;

  async function sendReply() {
    const content = draft.trim();
    if (!content || activeComplaint.status === "resolved") return;

    setSending(true);
    setSendError(null);
    try {
      const result = await sendAdminComplaintMessage(activeComplaint.id, content);
      if (!result.success) {
        setSendError(result.error);
        return;
      }
      setThread((current) => ({
        complaintId: activeComplaint.id,
        messages:
          current?.complaintId === activeComplaint.id
            ? [...current.messages, result.message]
            : [result.message],
      }));
      setDraft("");
    } catch (sendError) {
      setSendError(
        sendError instanceof Error ? sendError.message : "Could not send reply."
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Close messages dialog"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="complaint-messages-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-xl"
      >
        <header className="flex items-start justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 id="complaint-messages-title" className="text-lg font-bold text-gray-900">
              Messages with Resident
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {complaint.complaintCode} · {complaint.complainantName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-40 flex-1 space-y-2 overflow-y-auto bg-gray-50 p-4">
          {!threadForComplaint ? (
            <p className="text-sm text-gray-500">Loading messages...</p>
          ) : threadForComplaint.error ? (
            <p className="text-sm text-red-600">{threadForComplaint.error}</p>
          ) : threadForComplaint.messages.length === 0 ? (
            <p className="rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm text-gray-500">
              No messages yet.
            </p>
          ) : (
            threadForComplaint.messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[90%] rounded-lg border border-gray-100 px-3 py-2 ${
                  message.sender_role === "admin"
                    ? "ml-auto bg-eco-primary/10"
                    : "bg-white"
                }`}
              >
                <p className="text-xs font-semibold text-gray-700">
                  {message.sender_role === "admin" ? "You" : message.sender_name}
                </p>
                <p className="whitespace-pre-wrap break-words text-sm text-gray-800">
                  {message.message}
                </p>
                <p className="mt-1 text-right text-[11px] text-gray-500">
                  {new Date(message.created_at).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>

        {complaint.status === "resolved" ? (
          <p className="border-t border-gray-100 px-5 py-3 text-sm text-gray-500">
            This complaint is resolved. Messaging is closed.
          </p>
        ) : (
          <form
            className="space-y-2 border-t border-gray-100 p-4"
            onSubmit={(event) => {
              event.preventDefault();
              void sendReply();
            }}
          >
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={2000}
              rows={3}
              placeholder="Reply to the resident..."
              className="w-full resize-y rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-eco-primary focus:ring-2 focus:ring-eco-primary/20"
            />
            {sendError && <p className="text-sm text-red-600">{sendError}</p>}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={sending || !draft.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-eco-primary px-3 py-2 text-sm font-semibold text-white hover:bg-eco-dark disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
                {sending ? "Sending..." : "Send Reply"}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
