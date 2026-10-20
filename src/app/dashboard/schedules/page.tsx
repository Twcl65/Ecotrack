import SchedulesPageContent from "@/components/dashboard/schedules/SchedulesPageContent";
import { getAnnouncements } from "@/lib/announcement/data";
import { getDriverOptions } from "@/lib/routes/data";
import { getScheduleBarangayOptions, getSchedules } from "@/lib/schedules/data";

export default async function SchedulesPage() {
  const [schedules, driverOptions, barangayOptions, announcements] = await Promise.all([
    getSchedules(),
    getDriverOptions(),
    getScheduleBarangayOptions(),
    getAnnouncements(),
  ]);
  const holidayDates = announcements
    .filter((announcement) => announcement.type === "holiday" && announcement.status !== "expired")
    .map((announcement) => announcement.publishedAt);

  return (
    <SchedulesPageContent
      initialSchedules={schedules}
      driverOptions={driverOptions}
      barangayOptions={barangayOptions}
      holidayDates={holidayDates}
    />
  );
}
