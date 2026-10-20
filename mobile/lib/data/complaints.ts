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
  filedAt: string;
  attachmentUrl: string | null;
};

export type ComplaintMessage = {
  id: string;
  complaintId: string;
  senderId: string;
  senderRole: "resident" | "admin";
  senderName: string;
  message: string;
  createdAt: string;
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
  resident_id?: string | null;
  issue: string;
  barangay: string;
  status: string;
  filed_at: string;
  attachment_url?: string | null;
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
    filedAt: row.filed_at,
    attachmentUrl: row.attachment_url ?? null,
  };
}

export async function fetchUserComplaints(
  fullName: string,
  phone: string,
  residentId?: string
): Promise<UserComplaint[]> {
  const name = fullName.trim();
  const digits = phone.replace(/\D/g, "");

  let query = supabase
    .from("complaints")
    .select("*")
    .order("filed_at", { ascending: false });

  if (residentId) {
    query = query.eq("resident_id", residentId);
  } else if (name) {
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
  residentId?: string | null;
  complainantName: string;
  phone: string;
  barangay: string;
  issue: string;
  complaintType: string;
  attachmentUrl?: string | null;
}): Promise<{ success: boolean; error?: string; complaint?: UserComplaint }> {
  const issueText = `[${params.complaintType}] ${params.issue.trim()}`;
  const filedAt = new Date().toISOString();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const randomPart = Math.floor(Math.random() * 0x100000000)
      .toString(36)
      .padStart(7, "0")
      .toUpperCase();
    const code = `CMP-${Date.now().toString(36).toUpperCase()}-${randomPart}-${attempt + 1}`;
    const { data, error } = await supabase
      .from("complaints")
      .insert({
        resident_id: params.residentId ?? null,
        complaint_code: code,
        complainant_name: params.complainantName.trim(),
        phone: params.phone.trim(),
        barangay: params.barangay.trim(),
        issue: issueText,
        status: "pending",
        filed_at: filedAt,
        attachment_url: params.attachmentUrl ?? null,
      })
      .select()
      .single();

    if (!error) return { success: true, complaint: mapRow(data) };

    const errorText = `${error.message} ${error.details ?? ""}`;
    const isComplaintCodeConflict =
      error.code === "23505" &&
      errorText.includes("complaints_complaint_code_key");
    if (!isComplaintCodeConflict || attempt === 2) {
      return { success: false, error: error.message };
    }
  }

  return {
    success: false,
    error: "Could not generate a unique complaint number. Please try again.",
  };
}

export async function fetchResidentComplaint(
  complaintId: string,
  residentId: string
): Promise<UserComplaint | null> {
  const { data, error } = await supabase
    .from("complaints")
    .select("*")
    .eq("id", complaintId)
    .eq("resident_id", residentId)
    .maybeSingle();
  if (error) throw new Error(`Could not load complaint: ${error.message}`);
  return data ? mapRow(data) : null;
}

export async function fetchComplaintMessages(
  complaintId: string
): Promise<ComplaintMessage[]> {
  const { data, error } = await supabase
    .from("complaint_messages")
    .select("*")
    .eq("complaint_id", complaintId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Could not load complaint messages: ${error.message}`);
  return (data ?? []).map((row) => ({
    id: row.id,
    complaintId: row.complaint_id,
    senderId: row.sender_id,
    senderRole: row.sender_role,
    senderName: row.sender_name,
    message: row.message,
    createdAt: row.created_at,
  }));
}

export async function sendResidentComplaintMessage(
  complaintId: string,
  message: string,
  senderName: string
): Promise<string | null> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) return authError.message;
  if (!authData.user) return "Sign in to send a message.";
  const { error } = await supabase.from("complaint_messages").insert({
    complaint_id: complaintId,
    sender_id: authData.user.id,
    sender_role: "resident",
    sender_name: senderName.trim() || "Resident",
    message: message.trim(),
  });
  return error?.message ?? null;
}
