import ReportPageContent from "@/components/dashboard/reports/ReportPageContent";
import { getBarangays } from "@/lib/barangay/data";
import { getComplaints } from "@/lib/complaint/data";
import { getGeneratedReports, getWasteKgBaseline } from "@/lib/reports/data";
import { initialReportFilters } from "@/lib/reports/aggregate";
import { getSchedules } from "@/lib/schedules/data";
import { createClient } from "@/lib/supabase/server";

export default async function ReportPage() {
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

  const generatedBy =
    profile?.full_name ||
    profile?.username ||
    user?.email?.split("@")[0] ||
    "Admin";

  const [schedules, complaints, barangays, initialReports, wasteKgBaseline] =
    await Promise.all([
      getSchedules(),
      getComplaints(),
      getBarangays(),
      getGeneratedReports(),
      getWasteKgBaseline(),
    ]);

  const barangayOptions = [
    ...new Set([
      ...barangays.map((b) => b.name),
      ...schedules.map((s) => s.barangay),
    ]),
  ].sort((a, b) => a.localeCompare(b));

  return (
    <ReportPageContent
      schedules={schedules}
      complaints={complaints}
      barangayOptions={barangayOptions}
      initialReports={initialReports}
      initialFilters={initialReportFilters(schedules, complaints)}
      wasteKgBaseline={wasteKgBaseline}
      generatedBy={generatedBy}
    />
  );
}
