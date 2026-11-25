import ReportPageContent from "@/components/dashboard/reports/ReportPageContent";
import { getBarangays } from "@/lib/barangay/data";
import { getComplaints } from "@/lib/complaint/data";
import { getGeneratedReports } from "@/lib/reports/data";
import { defaultReportFilters } from "@/lib/reports/aggregate";
import { getSchedules } from "@/lib/schedules/data";
import { getRoutes } from "@/lib/routes/data";
import { getVehicles } from "@/lib/vehicles/data";
import { getAllMonthlyCollectionReports } from "@/lib/segregated-collection/monthly-data";
import { parseScheduleBarangays } from "@/lib/schedules/format";
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

  const [
    schedules,
    routes,
    complaints,
    barangays,
    initialReports,
    collectionReports,
    vehicles,
  ] = await Promise.all([
    getSchedules(),
    getRoutes(),
    getComplaints(),
    getBarangays(),
    getGeneratedReports(),
    getAllMonthlyCollectionReports(),
    getVehicles(),
  ]);

  const barangayOptions = [
    ...new Set([
      ...barangays.map((b) => b.name),
      ...schedules.flatMap((schedule) =>
        parseScheduleBarangays(schedule.barangay)
      ),
    ]),
  ].sort((a, b) => a.localeCompare(b));

  return (
    <ReportPageContent
      schedules={schedules}
      routes={routes}
      vehicles={vehicles}
      complaints={complaints}
      barangayOptions={barangayOptions}
      initialReports={initialReports}
      initialFilters={defaultReportFilters()}
      collectionReports={collectionReports}
      generatedBy={generatedBy}
    />
  );
}
