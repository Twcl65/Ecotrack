import { getAnnouncements } from "@/lib/announcement/data";
import { getBarangays } from "@/lib/barangay/data";
import { getComplaints } from "@/lib/complaint/data";
import {
  computeCollectionStatus,
  computeCollectionTrend,
  computeDashboardKpis,
  computeWeeklySchedule,
  emptyDashboardData,
  mapAnnouncementsForDashboard,
} from "@/lib/dashboard/aggregate";
import { getSchedules } from "@/lib/schedules/data";
import type { DashboardData } from "@/types/dashboard";

export async function getDashboardData(): Promise<DashboardData> {
  try {
    const [schedules, barangays, complaints, announcements] = await Promise.all([
      getSchedules(),
      getBarangays(),
      getComplaints(),
      getAnnouncements(),
    ]);

    const hasData =
      schedules.length > 0 ||
      barangays.length > 0 ||
      complaints.length > 0 ||
      announcements.length > 0;

    if (!hasData) {
      return emptyDashboardData();
    }

    return {
      kpis: computeDashboardKpis(
        schedules,
        barangays.filter((b) => b.status === "active").length || barangays.length,
        complaints.length
      ),
      collectionTrend: computeCollectionTrend(schedules),
      collectionStatus: computeCollectionStatus(schedules),
      weeklySchedule: computeWeeklySchedule(schedules),
      announcements: mapAnnouncementsForDashboard(announcements),
    };
  } catch {
    return emptyDashboardData();
  }
}
