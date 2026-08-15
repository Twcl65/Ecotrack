"use client";

import { ChevronDown, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  updateComplaintStatus,
} from "@/app/dashboard/complaint/actions";
import ComplaintAttachmentImage from "./ComplaintAttachmentImage";
import ComplaintStatusBadge from "./ComplaintStatusBadge";
import type { Complaint, ComplaintStatus } from "@/types/complaint";
import { COMPLAINT_STATUS_OPTIONS } from "@/types/complaint";

type Props = {
  complaint: Complaint | null;
  open: boolean;
  onClose: () => void;
  onSuccess: (complaint: Complaint) => void;
};

export default function ComplaintDetailsModal({
  complaint,
  open,
  onClose,
  onSuccess,
}: Props) {
  const [statusDraft, setStatusDraft] = useState<ComplaintStatus>("pending");
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !complaint) return;
    setStatusDraft(complaint.status);
    setShowStatusUpdate(false);
    setError(null);
  }, [open, complaint]);

  if (!open || !complaint) return null;

  async function saveStatus(status: ComplaintStatus) {
    setLoading(true);
    setError(null);
    const result = await updateComplaintStatus(complaint!.id, status);
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    if (result.complaint) onSuccess(result.complaint);
    setShowStatusUpdate(false);
    if (status === "resolved") onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Complaints Details</h2>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-800">
                {complaint.complaintCode}
              </span>
              <ComplaintStatusBadge status={complaint.status} />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <DetailBlock label="Complainant">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {complaint.complainantName}
                </p>
                <p className="text-sm text-gray-500">{complaint.phone}</p>
              </div>
            </div>
          </DetailBlock>

          <DetailBlock label="Barangay">
            <p className="text-sm text-gray-800">{complaint.barangay}</p>
          </DetailBlock>

          <DetailBlock label="Issue">
            <p className="text-sm text-gray-800">{complaint.issue}</p>
          </DetailBlock>

          <DetailBlock label="Date Filed">
            <p className="text-sm text-gray-800">{complaint.dateLabel}</p>
            <p className="text-sm text-gray-500">{complaint.timeLabel}</p>
          </DetailBlock>

          <DetailBlock label="Attachment">
            <ComplaintAttachmentImage
              src={complaint.attachmentUrl}
              className="max-h-48 w-full max-w-xs rounded-lg border border-gray-200 object-cover"
              emptyClassName="h-28 w-full max-w-xs rounded-lg border border-dashed border-gray-300 bg-gray-100"
            />
          </DetailBlock>

          {showStatusUpdate && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                New Status
              </label>
              <div className="relative">
                <select
                  value={statusDraft}
                  onChange={(e) =>
                    setStatusDraft(e.target.value as ComplaintStatus)
                  }
                  className="w-full appearance-none rounded-lg border border-gray-200 bg-white py-2.5 px-3 pr-8 text-sm outline-none focus:border-eco-primary focus:ring-2 focus:ring-eco-primary/20"
                >
                  {COMPLAINT_STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
              <button
                type="button"
                disabled={loading}
                onClick={() => saveStatus(statusDraft)}
                className="mt-2 rounded-lg bg-eco-primary px-3 py-1.5 text-sm font-semibold text-white hover:bg-eco-dark disabled:opacity-60"
              >
                {loading ? "Saving..." : "Save Status"}
              </button>
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
          <button
            type="button"
            onClick={() => {
              if (showStatusUpdate) {
                setShowStatusUpdate(false);
              } else {
                setStatusDraft(complaint.status);
                setShowStatusUpdate(true);
              }
            }}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Update Status
          </button>
          <button
            type="button"
            disabled={loading || complaint.status === "resolved"}
            onClick={() => saveStatus("resolved")}
            className="rounded-lg bg-eco-primary px-4 py-2 text-sm font-semibold text-white hover:bg-eco-dark disabled:opacity-60"
          >
            Mark as Resolved
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1 text-sm font-bold text-gray-900">{label}</p>
      {children}
    </div>
  );
}
