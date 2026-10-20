import type { Complaint, ComplaintFormValues, ComplaintStatus } from "@/types/complaint";

export function formatComplaintDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatComplaintTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function toDateInputValue(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function toTimeInputValue(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function mapComplaintRow(row: {
  id: string;
  complaint_code: string;
  complainant_name: string;
  phone: string;
  barangay: string;
  issue: string;
  status: string;
  filed_at: string;
  attachment_url: string | null;
  created_at: string;
  updated_at: string;
}): Complaint {
  return {
    id: row.id,
    complaintCode: row.complaint_code,
    complainantName: row.complainant_name,
    phone: row.phone,
    barangay: row.barangay,
    issue: row.issue,
    status: row.status as ComplaintStatus,
    filedAt: row.filed_at,
    dateLabel: formatComplaintDate(row.filed_at),
    timeLabel: formatComplaintTime(row.filed_at),
    attachmentUrl: row.attachment_url,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function complaintToFormValues(complaint: Complaint): ComplaintFormValues {
  return {
    complainantName: complaint.complainantName,
    phone: complaint.phone,
    barangay: complaint.barangay,
    issue: complaint.issue,
    status: complaint.status,
    filedDate: toDateInputValue(complaint.filedAt),
    filedTime: toTimeInputValue(complaint.filedAt),
    attachmentUrl: complaint.attachmentUrl ?? "",
  };
}

export function formValuesToFiledAt(values: ComplaintFormValues): string {
  const [y, m, d] = values.filedDate.split("-").map(Number);
  const [hh, mm] = values.filedTime.split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm).toISOString();
}
