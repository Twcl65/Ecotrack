import { supabase } from "@/lib/supabase";

const COMPLAINT_TYPES = [
  "Missed Collection",
  "Late Collection",
  "Overflowing Bins",
  "Improper Segregation",
  "Noise Complaint",
  "Other",
];

export { COMPLAINT_TYPES };

export type UserComplaint = {
  id: string;
  complaintCode: string;
  issue: string;
  barangay: string;
  status: string;
  statusLabel: string;
  dateLabel: string;
  timeLabel: string;
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  resolved: "Resolved",
  declined: "Declined",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return {
    dateLabel: d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    timeLabel: d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),
  };
}

function mapRow(row: {
  id: string;
  complaint_code: string;
  issue: string;
  barangay: string;
  status: string;
  filed_at: string;
}): UserComplaint {
  const { dateLabel, timeLabel } = formatDate(row.filed_at);
  return {
    id: row.id,
    complaintCode: row.complaint_code,
    issue: row.issue,
    barangay: row.barangay,
    status: row.status,
    statusLabel: STATUS_LABELS[row.status] ?? row.status,
    dateLabel,
    timeLabel,
  };
}

export async function fetchUserComplaints(
  fullName: string,
  phone: string
): Promise<UserComplaint[]> {
  const name = fullName.trim();
  const digits = phone.replace(/\D/g, "");

  let query = supabase
    .from("complaints")
    .select("*")
    .order("filed_at", { ascending: false });

  if (name) {
    query = query.ilike("complainant_name", name);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return data
    .filter((row) => {
      if (!digits || digits === "N/A") return true;
      return row.phone.replace(/\D/g, "").includes(digits.slice(-10));
    })
    .map(mapRow);
}

export async function submitComplaint(params: {
  complainantName: string;
  phone: string;
  barangay: string;
  issue: string;
  complaintType: string;
  attachmentUrl?: string | null;
}): Promise<{ success: boolean; error?: string; complaint?: UserComplaint }> {
  const { count } = await supabase
    .from("complaints")
    .select("*", { count: "exact", head: true });

  const code = `CMP-${String((count ?? 0) + 1).padStart(2, "0")}`;
  const issueText = `[${params.complaintType}] ${params.issue.trim()}`;

  const { data, error } = await supabase
    .from("complaints")
    .insert({
      complaint_code: code,
      complainant_name: params.complainantName.trim(),
      phone: params.phone.trim(),
      barangay: params.barangay.trim(),
      issue: issueText,
      status: "pending",
      filed_at: new Date().toISOString(),
      attachment_url: params.attachmentUrl ?? null,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, complaint: mapRow(data) };
}
