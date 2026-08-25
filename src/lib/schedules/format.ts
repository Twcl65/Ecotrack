import type { Route } from "@/types/routes";
import type { Schedule, ScheduleStatus } from "@/types/schedules";

/** Postgres TIME / timetz → "4:00 AM" */
export function formatTimeDisplay(time: string | null): string | null {
  if (!time) return null;
  const [hourStr, minuteStr] = time.split(":");
  let hour = parseInt(hourStr, 10);
  const minute = minuteStr?.slice(0, 2) ?? "00";
  const period = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour}:${minute} ${period}`;
}

/** "4:00 AM" or HTML time "04:00" → "04:00:00" for Postgres */
export function toDbTime(value: string): string | null {
  if (!value.trim()) return null;
  if (/^\d{2}:\d{2}$/.test(value)) return `${value}:00`;
  const match = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let hour = parseInt(match[1], 10);
  const minute = match[2];
  const period = match[3].toUpperCase();
  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;
  return `${String(hour).padStart(2, "0")}:${minute}:00`;
}

/** Postgres TIME → HTML time input value "04:00" */
export function toTimeInputValue(time: string | null): string {
  if (!time) return "";
  const [h, m] = time.split(":");
  return `${h.padStart(2, "0")}:${m.slice(0, 2)}`;
}

export function formatDateLabel(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function mapScheduleRow(
  row: {
    id: string;
    barangay: string;
    collection_date: string;
    route_id?: string | null;
    time_start: string | null;
    time_end: string | null;
    driver: string | null;
    status: string;
  },
  route?: Route
): Schedule {
  return {
    id: row.id,
    date: row.collection_date,
    dateLabel: formatDateLabel(row.collection_date),
    barangay: row.barangay,
    routeId: row.route_id ?? null,
    routeLabel: route ? `${route.routeCode} — ${route.name}` : null,
    timeStart: formatTimeDisplay(row.time_start),
    timeEnd: formatTimeDisplay(row.time_end),
    driver: row.driver,
    status: row.status as ScheduleStatus,
  };
}

export function scheduleToFormValues(schedule: Schedule): {
  barangay: string;
  collectionDate: string;
  routeId: string;
  timeStart: string;
  timeEnd: string;
  driver: string;
  status: ScheduleStatus;
} {
  return {
    barangay: schedule.barangay,
    collectionDate: schedule.date,
    routeId: schedule.routeId ?? "",
    timeStart: schedule.timeStart ? toTimeInputValue(toDbTime(schedule.timeStart) ?? "") : "",
    timeEnd: schedule.timeEnd ? toTimeInputValue(toDbTime(schedule.timeEnd) ?? "") : "",
    driver: schedule.driver ?? "",
    status: schedule.status,
  };
}
