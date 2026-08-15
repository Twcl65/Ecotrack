import SchedulesPageContent from "@/components/dashboard/schedules/SchedulesPageContent";
import { getDriverOptions } from "@/lib/routes/data";
import { getScheduleBarangayOptions, getSchedules } from "@/lib/schedules/data";

export default async function SchedulesPage() {
  const [schedules, driverOptions, barangayOptions] = await Promise.all([
    getSchedules(),
    getDriverOptions(),
    getScheduleBarangayOptions(),
  ]);

  return (
    <SchedulesPageContent
      initialSchedules={schedules}
      driverOptions={driverOptions}
      barangayOptions={barangayOptions}
    />
  );
}
