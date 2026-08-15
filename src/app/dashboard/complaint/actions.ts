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

export async function deleteComplaint(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("complaints").delete().eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/complaint");
  revalidatePath("/dashboard");
  return { success: true };
}
