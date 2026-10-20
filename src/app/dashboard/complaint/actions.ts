"use server";

import { revalidatePath } from "next/cache";
import { formValuesToFiledAt, mapComplaintRow } from "@/lib/complaint/format";
import { createClient } from "@/lib/supabase/server";
import type {
  Complaint,
  ComplaintFormValues,
  ComplaintStatus,
} from "@/types/complaint";

type ActionResult =
  | { success: true; complaint?: Complaint }
  | { success: false; error: string };

function validateForm(values: ComplaintFormValues): string | null {
  if (!values.complainantName.trim()) return "Complainant name is required.";
  if (!values.phone.trim()) return "Phone number is required.";
  if (!values.barangay.trim()) return "Barangay is required.";
  if (!values.issue.trim()) return "Issue description is required.";
  if (!values.filedDate) return "Date filed is required.";
  if (!values.filedTime) return "Time filed is required.";
  if (!values.status) return "Status is required.";
  return null;
}

function toRow(values: ComplaintFormValues) {
  return {
    complainant_name: values.complainantName.trim(),
    phone: values.phone.trim(),
    barangay: values.barangay.trim(),
    issue: values.issue.trim(),
    status: values.status,
    filed_at: formValuesToFiledAt(values),
    attachment_url: values.attachmentUrl.trim() || null,
    updated_at: new Date().toISOString(),
  };
}

export async function updateComplaint(
  id: string,
  values: ComplaintFormValues
): Promise<ActionResult> {
  const err = validateForm(values);
  if (err) return { success: false, error: err };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("complaints")
    .update(toRow(values))
    .eq("id", id)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/complaint");
  revalidatePath("/dashboard");
  return { success: true, complaint: mapComplaintRow(data) };
}

export async function updateComplaintStatus(
  id: string,
  status: ComplaintStatus
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("complaints")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/complaint");
  revalidatePath("/dashboard");
  return { success: true, complaint: mapComplaintRow(data) };
}

export type ComplaintThreadMessage = {
  id: string;
  complaint_id: string;
  sender_id: string;
  sender_role: "resident" | "admin";
  sender_name: string;
  message: string;
  created_at: string;
};

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error(authError?.message ?? "Sign in as an administrator.");
  }
  const { data: systemUser, error } = await supabase
    .from("system_users")
    .select("id, role, first_name, middle_name, last_name")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw new Error(`Could not verify administrator access: ${error.message}`);
  if (!systemUser || !["admin", "administrator"].includes(systemUser.role)) {
    throw new Error("Administrator access is required.");
  }
  const name = [
    systemUser.first_name,
    systemUser.middle_name?.trim(),
    systemUser.last_name,
  ]
    .filter(Boolean)
    .join(" ");
  return { supabase, user, name: name || "Admin" };
}

export async function getComplaintMessages(
  complaintId: string
): Promise<{ success: true; messages: ComplaintThreadMessage[] } | { success: false; error: string }> {
  try {
    const { supabase } = await requireAdmin();
    const { data, error } = await supabase
      .from("complaint_messages")
      .select("*")
      .eq("complaint_id", complaintId)
      .order("created_at", { ascending: true });
    if (error) return { success: false, error: error.message };
    return { success: true, messages: data ?? [] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not load complaint messages.",
    };
  }
}

export async function sendAdminComplaintMessage(
  complaintId: string,
  message: string
): Promise<{ success: true; message: ComplaintThreadMessage } | { success: false; error: string }> {
  const content = message.trim();
  if (!content) return { success: false, error: "Enter a message before sending." };
  if (content.length > 2000) {
    return { success: false, error: "Message must be 2000 characters or less." };
  }
  try {
    const { supabase, user, name } = await requireAdmin();
    const { data: complaint, error: complaintError } = await supabase
      .from("complaints")
      .select("status")
      .eq("id", complaintId)
      .single();
    if (complaintError) return { success: false, error: complaintError.message };
    if (complaint.status === "resolved") {
      return { success: false, error: "This complaint is resolved; messaging is closed." };
    }
    const { data, error } = await supabase
      .from("complaint_messages")
      .insert({
        complaint_id: complaintId,
        sender_id: user.id,
        sender_role: "admin",
        sender_name: name,
        message: content,
      })
      .select()
      .single();
    if (error) return { success: false, error: error.message };
    revalidatePath("/dashboard/complaint");
    return { success: true, message: data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not send reply.",
    };
  }
}

export async function deleteComplaint(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("complaints").delete().eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/complaint");
  revalidatePath("/dashboard");
  return { success: true };
}
