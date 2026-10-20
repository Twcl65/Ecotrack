import { supabase } from "@/lib/supabase";
import type { AppRole } from "@/lib/auth";

export const FEEDBACK_CATEGORIES = [
  "Collection Service",
  "Mobile App",
  "Schedule",
  "Other",
] as const;

export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];

export type UserFeedback = {
  id: string;
  category: FeedbackCategory;
  message: string;
  rating: number | null;
  status: "new" | "reviewed";
  createdAt: string;
};

export async function fetchUserFeedback(userId: string): Promise<UserFeedback[]> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw new Error(`Could not verify your session: ${authError.message}`);
  if (!authData.user || authData.user.id !== userId) {
    throw new Error("Sign in again to view your feedback.");
  }

  const { data, error } = await supabase
    .from("feedback")
    .select("id, category, message, rating, status, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load your feedback: ${error.message}`);

  return (data ?? []).map((item) => ({
    id: item.id,
    category: item.category,
    message: item.message,
    rating: item.rating,
    status: item.status,
    createdAt: item.created_at,
  }));
}

export async function submitFeedback(params: {
  userId: string;
  userName: string;
  userRole: AppRole;
  category: FeedbackCategory;
  message: string;
  rating: number | null;
}): Promise<string | null> {
  const { data, error: authError } = await supabase.auth.getUser();
  if (authError) return authError.message;
  if (!data.user) return "Sign in to send feedback.";
  if (data.user.id !== params.userId) return "Your session has changed. Please sign in again.";
  if (params.userRole !== "resident" && params.userRole !== "driver") {
    return "Only residents and drivers can submit feedback.";
  }

  const { error } = await supabase.from("feedback").insert({
    user_id: params.userId,
    user_name: params.userName.trim() || params.userRole,
    user_role: params.userRole,
    category: params.category,
    message: params.message.trim(),
    rating: params.rating,
  });
  return error?.message ?? null;
}
