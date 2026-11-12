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
import { getMonthlyCollectionReports } from "@/lib/segregated-collection/monthly-data";
import type { DashboardData } from "@/types/dashboard";

export async function getDashboardData(): Promise<DashboardData> {
  try {
    const reportYear = new Date().getFullYear();
    const [schedules, barangays, complaints, announcements, collectionReports] = await Promise.all([
      getSchedules(),
      getBarangays(),
      getComplaints(),
      getAnnouncements(),
      getMonthlyCollectionReports(reportYear),
    ]);

    const hasData =
      schedules.length > 0 ||
      barangays.length > 0 ||
      complaints.length > 0 ||
      announcements.length > 0 ||
      collectionReports.length > 0;

    if (!hasData) {
      return emptyDashboardData();
    }

    return {
      kpis: computeDashboardKpis(
        schedules,
        barangays.filter((b) => b.status === "active").length || barangays.length,
        complaints.length,
        collectionReports.reduce((total, report) => total + report.totalKg, 0)
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
