import type {
  Announcement,
  CollectionStatusItem,
  CollectionTrendPoint,
  DashboardKpis,
  WeeklyScheduleItem,
} from "@/types/dashboard";
import type { Schedule, ScheduleStatus } from "@/types/schedules";
import { isOperationalSchedule } from "@/lib/collection/aggregate";

const AVG_WASTE_KG_PER_COLLECTION = 850;

const STATUS_COLORS: Record<string, string> = {
  completed: "#056636",
  in_progress: "#3b82f6",
  pending: "#eab308",
  cancelled: "#ef4444",
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function scheduleToDashboardStatus(
  status: ScheduleStatus
): "completed" | "pending" {
  return status === "completed" ? "completed" : "pending";
}

function mapScheduleStatusToChart(status: ScheduleStatus): CollectionStatusItem["status"] | null {
  switch (status) {
    case "completed":
      return "completed";
    case "ongoing":
      return "in_progress";
    case "pending":
      return "pending";
    case "canceled":
      return "cancelled";
    default:
      return null;
  }
}

export function computeDashboardKpis(
  schedules: Schedule[],
  totalBarangay: number,
  totalComplaint: number
): DashboardKpis {
  const today = todayIso();
  const operational = schedules.filter(isOperationalSchedule);
  const todaySchedules = operational.filter((s) => s.date === today);
  const completed = operational.filter((s) => s.status === "completed");

  return {
    todaysCollection: todaySchedules.length,
    totalBarangay,
    totalComplaint,
    wasteCollectedKg: completed.length * AVG_WASTE_KG_PER_COLLECTION,
  };
}

export function computeCollectionTrend(schedules: Schedule[]): CollectionTrendPoint[] {
  const operational = schedules.filter(isOperationalSchedule);
  if (operational.length === 0) return [];

  const referenceDate = pickTrendReferenceDate(operational);
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const counts = new Map<string, number>();
  for (const s of operational) {
    const d = new Date(`${s.date}T12:00:00`);
    if (d.getFullYear() === year && d.getMonth() === month) {
      counts.set(s.date, (counts.get(s.date) ?? 0) + 1);
    }
  }

  return Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const label = new Date(year, month, day).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    return { date, label, collections: counts.get(date) ?? 0 };
  });
}

function pickTrendReferenceDate(schedules: Schedule[]): Date {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const hasCurrentMonth = schedules.some((s) => {
    const d = new Date(`${s.date}T12:00:00`);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  if (hasCurrentMonth) return now;

  const latest = schedules.reduce((max, s) => (s.date > max ? s.date : max), schedules[0].date);
  return new Date(`${latest}T12:00:00`);
}

export function computeCollectionStatus(schedules: Schedule[]): CollectionStatusItem[] {
  const today = todayIso();
  const operational = schedules.filter(isOperationalSchedule);
  const todaySchedules = operational.filter((s) => s.date === today);
  const source = todaySchedules.length > 0 ? todaySchedules : operational;

  const counts = {
    completed: 0,
    in_progress: 0,
    pending: 0,
    cancelled: 0,
  };

  for (const s of source) {
    const mapped = mapScheduleStatusToChart(s.status);
    if (mapped) counts[mapped] += 1;
  }

  const total = counts.completed + counts.in_progress + counts.pending + counts.cancelled;
  if (total === 0) {
    return [
      { status: "completed", label: "Completed", count: 0, percentage: 0, color: STATUS_COLORS.completed },
      { status: "in_progress", label: "In Progress", count: 0, percentage: 0, color: STATUS_COLORS.in_progress },
      { status: "pending", label: "Pending", count: 0, percentage: 0, color: STATUS_COLORS.pending },
      { status: "cancelled", label: "Cancelled", count: 0, percentage: 0, color: STATUS_COLORS.cancelled },
    ];
  }

  return (["completed", "in_progress", "pending", "cancelled"] as const).map((status) => ({
    status,
    label:
      status === "in_progress"
        ? "In Progress"
        : status.charAt(0).toUpperCase() + status.slice(1).replace("_", " "),
    count: counts[status],
    percentage: Math.round((counts[status] / total) * 100),
    color: STATUS_COLORS[status],
  }));
}

export function computeWeeklySchedule(schedules: Schedule[]): WeeklyScheduleItem[] {
  const operational = schedules.filter(isOperationalSchedule);
  if (operational.length === 0) return [];

  const weekDates = getCurrentWeekWeekdays(pickWeekReferenceDate(operational));
  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri"];

  return weekDates.map((date, index) => {
    const iso = formatIsoDate(date);
    const daySchedules = operational.filter((s) => s.date === iso);
    const primary = daySchedules[0];

    return {
      id: primary?.id ?? `week-${iso}`,
      day: dayLabels[index],
      date: date.toLocaleDateString("en-US", { month: "long", day: "numeric" }),
      barangay: primary?.barangay ?? "No schedule",
      status: primary ? scheduleToDashboardStatus(primary.status) : "pending",
    };
  });
}

function pickWeekReferenceDate(schedules: Schedule[]): Date {
  const now = new Date();
  const weekDates = getCurrentWeekWeekdays(now);
  const weekIsos = new Set(weekDates.map(formatIsoDate));

  if (schedules.some((s) => weekIsos.has(s.date))) {
    return now;
  }

  const latest = schedules.reduce((max, s) => (s.date > max ? s.date : max), schedules[0].date);
  return new Date(`${latest}T12:00:00`);
}

function getCurrentWeekWeekdays(base: Date): Date[] {
  const d = new Date(base);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setHours(12, 0, 0, 0);
  monday.setDate(d.getDate() + diff);

  return Array.from({ length: 5 }, (_, i) => {
    const x = new Date(monday);
    x.setDate(monday.getDate() + i);
    return x;
  });
}

function formatIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function mapAnnouncementsForDashboard(
  items: {
    id: string;
    title: string;
    content: string;
    publishedAt: string | null;
    created_at: string;
    status: string;
  }[]
): Announcement[] {
  return items
    .filter((a) => a.status === "active" || a.status === "scheduled" || a.publishedAt)
    .slice(0, 5)
    .map((a) => ({
      id: a.id,
      title: a.title,
      content: a.content,
      created_at: a.publishedAt ?? a.created_at,
    }));
}

export function emptyDashboardData(): {
  kpis: DashboardKpis;
  collectionTrend: CollectionTrendPoint[];
  collectionStatus: CollectionStatusItem[];
  weeklySchedule: WeeklyScheduleItem[];
  announcements: Announcement[];
} {
  return {
    kpis: {
      todaysCollection: 0,
      totalBarangay: 0,
      totalComplaint: 0,
      wasteCollectedKg: 0,
    },
    collectionTrend: [],
    collectionStatus: computeCollectionStatus([]),
    weeklySchedule: [],
    announcements: [],
  };
}
