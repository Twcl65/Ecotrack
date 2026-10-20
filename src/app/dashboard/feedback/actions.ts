"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw new Error(`Could not verify administrator access: ${error.message}`);
  if (!systemUser || !["admin", "administrator"].includes(systemUser.role)) {
    throw new Error("Administrator access is required.");
  }
  return supabase;
}

export async function markFeedbackReviewed(
  feedbackId: string
): Promise<{ success: true } | { success: false; error: string }> {
  if (!feedbackId.trim()) {
    return { success: false, error: "Feedback record is required." };
  }

  try {
    const supabase = await requireAdmin();
    const { error } = await supabase
      .from("feedback")
      .update({ status: "reviewed" })
      .eq("id", feedbackId);
    if (error) return { success: false, error: error.message };
    revalidatePath("/dashboard/feedback");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Could not update feedback status.",
    };
  }
}
