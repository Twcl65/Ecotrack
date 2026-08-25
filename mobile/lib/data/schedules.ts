import { startOfToday } from "../date";
import { supabase } from "../supabase";

export type ScheduleItem = {
  id: string;
  barangay: string;
  date: string;
  dateLabel: string;
  dayLabel: string;
  timeStart: string | null;
  timeEnd: string | null;
  driver: string | null;
  status: string;
};

function formatDateLabel(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatDayLabel(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

function formatTime(time: string | null): string | null {
  if (!time) return null;
  const [hourStr, minuteStr] = time.split(":");
  let hour = parseInt(hourStr, 10);
  const minute = minuteStr?.slice(0, 2) ?? "00";
  const period = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour}:${minute} ${period}`;
}

export async function fetchSchedules(): Promise<ScheduleItem[]> {
  const { data, error } = await supabase
    .from("collection_schedules")
    .select("*")
    .order("collection_date", { ascending: true });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    barangay: row.barangay,
    date: row.collection_date,
    dateLabel: formatDateLabel(row.collection_date),
    dayLabel: formatDayLabel(row.collection_date),
    timeStart: formatTime(row.time_start),
    timeEnd: formatTime(row.time_end),
    driver: row.driver ?? null,
    status: row.status,
  }));
}

export function formatTimeRange(start: string | null, end: string | null): string {
  if (!start && !end) return "TBD";
  if (start && end) return `${start} - ${end}`;
  return start ?? end ?? "TBD";
}

export function getNextCollection(schedules: ScheduleItem[]): ScheduleItem | null {
  const today = startOfToday();
  const upcoming = schedules.filter((s) => {
    const d = new Date(`${s.date}T12:00:00`);
    return d >= today && s.status !== "no_collection" && s.status !== "canceled";
  });
  return upcoming[0] ?? null;
}
