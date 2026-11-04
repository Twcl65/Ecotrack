import { redirect } from "next/navigation";
import AdminProfileForm from "@/components/dashboard/profile/AdminProfileForm";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/?login=1");

  const [{ data: profile, error: profileError }, { data: systemUser, error: statusError }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, username, email, role, avatar_url")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("system_users")
        .select("status")
        .eq("id", user.id)
        .maybeSingle(),
    ]);

  if (profileError) throw new Error(`Could not load your profile: ${profileError.message}`);
  if (statusError) throw new Error(`Could not load your account status: ${statusError.message}`);

  return (
    <AdminProfileForm
      userId={user.id}
      initialProfile={{
        fullName: profile?.full_name?.trim() || "",
        username: profile?.username || "",
        email: profile?.email || user.email || "",
        role:
          profile?.role === "administrator"
            ? "Administrator"
            : profile?.role
              ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1)
              : "Administrator",
        status: systemUser?.status
          ? systemUser.status.charAt(0).toUpperCase() + systemUser.status.slice(1)
          : "Unknown",
        avatarUrl: profile?.avatar_url || null,
      }}
    />
  );
}
