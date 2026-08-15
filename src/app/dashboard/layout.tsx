import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { getAdminNotifications } from "@/lib/notifications/data";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/?login=1");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, username")
    .eq("id", user.id)
    .single();

  const userName =
    profile?.full_name ||
    profile?.username ||
    user.email?.split("@")[0] ||
    "Admin";
  const userEmail = user.email ?? "admin@gmail.com";

  const notifications = await getAdminNotifications();

  return (
    <DashboardShell
      userName={userName}
      userEmail={userEmail}
      notifications={notifications}
    >
      {children}
    </DashboardShell>
  );
}
