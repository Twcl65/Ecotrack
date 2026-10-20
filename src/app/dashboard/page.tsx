import CollectionsOverTimeChart from "@/components/dashboard/CollectionsOverTimeChart";
import CollectionStatusChart from "@/components/dashboard/CollectionStatusChart";
import DashboardWelcome from "@/components/dashboard/DashboardWelcome";
import KpiCards from "@/components/dashboard/KpiCards";
import RecentAnnouncements from "@/components/dashboard/RecentAnnouncements";
import WeeklySchedule from "@/components/dashboard/WeeklySchedule";
import { getDashboardData } from "@/lib/dashboard/data";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("full_name, username")
        .eq("id", user.id)
        .single()
    : { data: null };

  const userName =
    profile?.full_name ||
    profile?.username ||
    user?.email?.split("@")[0] ||
    "Admin";

  const data = await getDashboardData();

  return (
    <div className="dashboard-page">
      <DashboardWelcome userName={userName} />
      <KpiCards kpis={data.kpis} />

      <div className="dashboard-split-row">
        <CollectionsOverTimeChart data={data.collectionTrend} />
        <CollectionStatusChart data={data.collectionStatus} />
      </div>

      <div className="dashboard-split-row">
        <WeeklySchedule schedule={data.weeklySchedule} />
        <RecentAnnouncements announcements={data.announcements} />
      </div>
    </div>
  );
}
