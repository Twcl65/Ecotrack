import type {
  CollectionActivity,
  CollectionMapMarker,
  CollectionMonitoringKpis,
  CollectionProgressSlice,
  CollectionSummary,
} from "@/types/collection-monitoring";
import { BARANGAY_MAP_COORDS } from "@/types/collection-monitoring";
import type { Schedule, ScheduleStatus } from "@/types/schedules";
import { DRIVER_OPTIONS } from "@/types/schedules";

const EXCLUDED: ScheduleStatus[] = ["no_collection", "maintenance"];

const PROGRESS_COLORS: Record<string, string> = {
  completed: "#056636",
  ongoing: "#3b82f6",
  pending: "#f59e0b",
  canceled: "#9ca3af",
};

const PROGRESS_LABELS: Record<string, string> = {
  completed: "Completed",
  ongoing: "In Progress",
  pending: "Pending",
  canceled: "Cancelled",
};

export function vehicleForDriver(driver: string | null): string {
  if (!driver) return "—";
  const idx = DRIVER_OPTIONS.findIndex(
    (d) => d.toLowerCase() === driver.toLowerCase()
  );
  const num = idx >= 0 ? idx + 1 : driver.charCodeAt(0) % 9 + 1;
  return `TRK-${String(num).padStart(3, "0")}`;
}

export function isOperationalSchedule(schedule: Schedule): boolean {
  return !EXCLUDED.includes(schedule.status);
}

export function filterSchedules(
  schedules: Schedule[],
  filters: {
    date: string;
    barangay: string;
    driver: string;
    status: string;
  }
): Schedule[] {
  return schedules.filter((s) => {
    if (s.date !== filters.date) return false;
    if (filters.barangay !== "all" && s.barangay !== filters.barangay) return false;
    if (filters.driver !== "all" && s.driver !== filters.driver) return false;
    if (filters.status !== "all" && s.status !== filters.status) return false;
    return true;
  });
}

export function computeMonitoringKpis(
  schedules: Schedule[],
  date: string,
  routesCount: number
): CollectionMonitoringKpis {
  const daySchedules = schedules.filter(
    (s) => s.date === date && isOperationalSchedule(s)
  );
  const futurePending = schedules.filter(
    (s) => s.date > date && s.status === "pending" && isOperationalSchedule(s)
  );

  return {
    todaysCollection: daySchedules.length,
    inProgress: daySchedules.filter((s) => s.status === "ongoing").length,
    upcoming: futurePending.length,
    totalRoutes: routesCount,
  };
}

export function computeProgress(
  daySchedules: Schedule[]
): { slices: CollectionProgressSlice[]; overallPercent: number } {
  const operational = daySchedules.filter(isOperationalSchedule);
  const total = operational.length;

  const statuses: (ScheduleStatus | "cancelled")[] = [
    "completed",
    "ongoing",
    "pending",
    "canceled",
  ];

  const slices: CollectionProgressSlice[] = statuses.map((status) => ({
    status,
    label: PROGRESS_LABELS[status],
    count: operational.filter((s) => s.status === status).length,
    color: PROGRESS_COLORS[status],
  }));

  const completed = slices.find((s) => s.status === "completed")?.count ?? 0;
  const overallPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { slices, overallPercent };
}

export function computeSummary(
  daySchedules: Schedule[],
  wasteCollectedKg: number
): CollectionSummary {
  const operational = daySchedules.filter(isOperationalSchedule);
  const completed = operational.filter((s) => s.status === "completed").length;
  const inProgress = operational.filter((s) => s.status === "ongoing").length;
  const pending = operational.filter((s) => s.status === "pending").length;
  const cancelled = operational.filter((s) => s.status === "canceled").length;

  const wasteKg =
    completed > 0
      ? Math.round(
          (wasteCollectedKg / Math.max(operational.length, 1)) * completed
        )
      : 0;

  return {
    total: operational.length,
    completed,
    inProgress,
    pending,
    cancelled,
    wasteKg,
  };
}

export function buildMapMarkers(daySchedules: Schedule[]): CollectionMapMarker[] {
  const operational = daySchedules.filter(isOperationalSchedule);

  return operational.map((s) => {
    const coords = BARANGAY_MAP_COORDS[s.barangay] ?? { x: 50, y: 50 };
    return {
      barangay: s.barangay,
      x: coords.x,
      y: coords.y,
      status: s.status,
    };
  });
}

export function buildRecentActivity(
  schedules: Schedule[],
  date: string
): CollectionActivity[] {
  const items: CollectionActivity[] = [];
  const selected = schedules.find((s) => s.date === date && isOperationalSchedule(s));
  const tomorrow = addDays(date, 1);
  const tomorrowSchedule = schedules.find(
    (s) => s.date === tomorrow && isOperationalSchedule(s)
  );

  if (selected) {
    if (selected.status === "ongoing") {
      items.push({
        id: `${selected.id}-route`,
        tone: "info",
        message: `Driver ${selected.driver ?? "assigned"} is on the way — To ${selected.barangay}`,
        timeLabel: formatActivityTime(selected.timeStart ?? "10:05 AM"),
      });
    }
    items.push({
      id: `${selected.id}-scheduled`,
      tone: "success",
      message: `Collection scheduled in ${selected.barangay} — Residual Waste Collection`,
      timeLabel: formatActivityTime(selected.timeStart ?? "10:15 AM"),
    });
  }

  if (tomorrowSchedule) {
    const d = new Date(`${tomorrow}T12:00:00`);
    items.push({
      id: `${tomorrowSchedule.id}-tomorrow`,
      tone: "warning",
      message: `Collection scheduled for tomorrow — ${d.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })} (${d.toLocaleDateString("en-US", { weekday: "long" })})`,
      timeLabel: "09:30 AM",
    });
  }

  const recentCompleted = schedules
    .filter((s) => s.status === "completed" && s.date <= date)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 2);

  for (const s of recentCompleted) {
    if (items.some((i) => i.id === s.id)) continue;
    items.push({
      id: s.id,
      tone: "success",
      message: `Collection completed in ${s.barangay}`,
      timeLabel: formatActivityTime(s.timeEnd ?? s.timeStart ?? "08:00 AM"),
    });
  }

  return items.slice(0, 5);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatActivityTime(time: string): string {
  return time.includes("AM") || time.includes("PM") ? time : time;
}

export function formatShortDate(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatCardDate(dateStr: string): { day: string; month: string; date: string } {
  const d = new Date(`${dateStr}T12:00:00`);
  return {
    day: d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(),
    month: d.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
    date: String(d.getDate()).padStart(2, "0"),
  };
}
