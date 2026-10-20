import { redirect } from "next/navigation";
import FeedbackPageContent from "@/components/dashboard/feedback/FeedbackPageContent";
import { createClient } from "@/lib/supabase/server";

export default async function FeedbackPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError) throw new Error(`Could not verify your session: ${authError.message}`);
  if (!user) redirect("/?login=1");

  const { data: systemUser, error: roleError } = await supabase
    .from("system_users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (roleError) throw new Error(`Could not verify administrator access: ${roleError.message}`);
  if (!systemUser || !["admin", "administrator"].includes(systemUser.role)) {
    redirect("/dashboard");
  }

  const { data, error } = await supabase
    .from("feedback")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load feedback: ${error.message}`);

  return <FeedbackPageContent initialFeedback={data ?? []} />;
}
