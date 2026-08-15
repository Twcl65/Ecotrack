import type { Complaint } from "@/types/complaint";
import type {
  ReportAnalytics,
  ReportBarangayPoint,
  ReportFilters,
  ReportKpis,
  ReportStatusSlice,
  ReportTrendPoint,
} from "@/types/reports";
import type { Schedule } from "@/types/schedules";

const WASTE_KG_PER_COLLECTION = 1334;

function inRange(dateStr: string, from: string, to: string): boolean {
  return dateStr >= from && dateStr <= to;
}

function filterSchedules(
  schedules: Schedule[],
  filters: ReportFilters
): Schedule[] {
  return schedules.filter((s) => {
    if (!inRange(s.date, filters.fromDate, filters.toDate)) return false;
    if (filters.barangay !== "all" && s.barangay !== filters.barangay)
      return false;
    return true;
  });
}

function filterComplaints(
  complaints: Complaint[],
  filters: ReportFilters
): Complaint[] {
  return complaints.filter((c) => {
    const filedDate = c.filedAt.slice(0, 10);
    if (!inRange(filedDate, filters.fromDate, filters.toDate)) return false;
    if (filters.barangay !== "all" && c.barangay !== filters.barangay)
      return false;
    return true;
  });
}

function formatTrendLabel(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatPeriodLabel(from: string, to: string): string {
  const fromD = new Date(`${from}T12:00:00`);
  const toD = new Date(`${to}T12:00:00`);
  const fromLabel = fromD.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const toLabel = toD.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${fromLabel} - ${toLabel}`;
}

export function buildPeriodLabel(from: string, to: string): string {
  const fromD = new Date(`${from}T12:00:00`);
  const toD = new Date(`${to}T12:00:00`);
  if (
    fromD.getMonth() === toD.getMonth() &&
    fromD.getFullYear() === toD.getFullYear() &&
    fromD.getDate() === 1 &&
    toD.getDate() ===
      new Date(toD.getFullYear(), toD.getMonth() + 1, 0).getDate()
  ) {
    return `${toD.toLocaleDateString("en-US", { month: "short" })} 1 - ${toD.toLocaleDateString("en-US", { month: "short" })} ${toD.getDate()}, ${toD.getFullYear()}`;
  }
  return formatPeriodLabel(from, to);
}

export function computeReportAnalytics(
  schedules: Schedule[],
  complaints: Complaint[],
  filters: ReportFilters,
  wasteKgBaseline = 30670
): ReportAnalytics {
  const filteredSchedules = filterSchedules(schedules, filters);
  const filteredComplaints = filterComplaints(complaints, filters);

  const eligible = filteredSchedules.filter(
    (s) => s.status !== "no_collection" && s.status !== "maintenance"
  );
  const completed = eligible.filter((s) => s.status === "completed");
  const inProgress = eligible.filter(
    (s) => s.status === "ongoing" || s.status === "pending"
  );
  const cancelled = eligible.filter((s) => s.status === "canceled");

  const drivers = new Set(
    filteredSchedules
      .map((s) => s.driver)
      .filter((d): d is string => Boolean(d?.trim()))
  );

  const completedCount = completed.length;
  const totalEligible = eligible.length;
  const collectionRate =
    totalEligible > 0
      ? Math.round((completedCount / totalEligible) * 100)
      : 0;

  const allCompleted = schedules.filter((s) => s.status === "completed").length;
  const kgPerCompleted =
    allCompleted > 0
      ? wasteKgBaseline / allCompleted
      : WASTE_KG_PER_COLLECTION;

  const kpis: ReportKpis = {
    totalCollections: filteredSchedules.length,
    totalComplaints: filteredComplaints.length,
    activeDrivers: drivers.size,
    collectionRate,
    totalWasteKg: Math.round(completedCount * kgPerCompleted),
  };

  const dateMap = new Map<string, number>();
  for (const s of filteredSchedules) {
    if (s.status === "no_collection" || s.status === "maintenance") continue;
    dateMap.set(s.date, (dateMap.get(s.date) ?? 0) + 1);
  }

  const collectionsOverTime: ReportTrendPoint[] = [...dateMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, collections]) => ({
      date,
      label: formatTrendLabel(date),
      collections,
    }));

  const barangayMap = new Map<string, number>();
  for (const s of filteredSchedules) {
    if (s.status === "no_collection" || s.status === "maintenance") continue;
    barangayMap.set(s.barangay, (barangayMap.get(s.barangay) ?? 0) + 1);
  }

  const topBarangays: ReportBarangayPoint[] = [...barangayMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([barangay, collections]) => ({ barangay, collections }));

  const statusTotal = completedCount + inProgress.length + cancelled.length;
  const pct = (n: number) =>
    statusTotal > 0 ? Math.round((n / statusTotal) * 100) : 0;

  const emptyStatusBreakdown: ReportStatusSlice[] = [
    {
      status: "completed",
      label: "Completed",
      count: 0,
      percentage: 0,
      color: "#056636",
    },
    {
      status: "in_progress",
      label: "In Progress",
      count: 0,
      percentage: 0,
      color: "#3b82f6",
    },
    {
      status: "cancelled",
      label: "Cancelled",
      count: 0,
      percentage: 0,
      color: "#eab308",
    },
  ];

  const statusBreakdown: ReportStatusSlice[] =
    statusTotal === 0
      ? emptyStatusBreakdown
      : [
          {
            status: "completed" as const,
            label: "Completed",
            count: completedCount,
            percentage: pct(completedCount),
            color: "#056636",
          },
          {
            status: "in_progress" as const,
            label: "In Progress",
            count: inProgress.length,
            percentage: pct(inProgress.length),
            color: "#3b82f6",
          },
          {
            status: "cancelled" as const,
            label: "Cancelled",
            count: cancelled.length,
            percentage: pct(cancelled.length),
            color: "#eab308",
          },
        ].filter((s) => s.count > 0);

  return {
    kpis,
    collectionsOverTime,
    topBarangays,
    statusBreakdown,
  };
}

export function defaultReportFilters(): ReportFilters {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = now;
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  return {
    fromDate: fmt(from),
    toDate: fmt(to),
    reportType: "all",
    barangay: "all",
  };
}

export function initialReportFilters(
  schedules: Schedule[],
  complaints: Complaint[]
): ReportFilters {
  const dates = [
    ...schedules.map((s) => s.date),
    ...complaints.map((c) => c.filedAt.slice(0, 10)),
  ].sort();

  if (dates.length === 0) return defaultReportFilters();

  return {
    fromDate: dates[0],
    toDate: dates[dates.length - 1],
    reportType: "all",
    barangay: "all",
  };
}
