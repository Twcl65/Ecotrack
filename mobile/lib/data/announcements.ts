import { supabase } from "../supabase";

const APP_TIME_ZONE = "Asia/Manila";

export type AnnouncementItem = {
  id: string;
  title: string;
  content: string;
  dateLabel: string;
  date: string;
  type: string;
};

export type HolidayItem = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  dates: string[];
  timeLabel: string;
};

function localDateKey(value: string): string {
  const dateParts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: APP_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(new Date(value))
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );
  return `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: APP_TIME_ZONE,
  });
}

function formatHolidayTimeRange(publishedAt: string, expiresAt: string | null): string {
  if (!expiresAt) return `Starts ${formatTime(publishedAt)}`;
  const startDate = localDateKey(publishedAt);
  const endDate = localDateKey(expiresAt);
  const startLabel = `${formatDate(publishedAt)} ${formatTime(publishedAt)}`;
  const endLabel =
    startDate === endDate
      ? formatTime(expiresAt)
      : `${formatDate(expiresAt)} ${formatTime(expiresAt)}`;
  return `${startLabel} – ${endLabel}`;
}

function dateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(`${startDate}T12:00:00Z`);
  const end = new Date(`${endDate}T12:00:00Z`);
  while (current <= end) {
    dates.push(
      `${current.getUTCFullYear()}-${String(current.getUTCMonth() + 1).padStart(2, "0")}-${String(current.getUTCDate()).padStart(2, "0")}`
    );
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: APP_TIME_ZONE,
  });
}

export async function fetchAnnouncements(): Promise<AnnouncementItem[]> {
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  const now = Date.now();
  return data
    .filter((row) => {
      const publishedAt = row.published_at ?? row.created_at;
      if (new Date(publishedAt).getTime() > now) return false;
      if (row.expires_at && new Date(row.expires_at).getTime() < now) return false;
      return true;
    })
    .map((row) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      dateLabel: formatDate(row.published_at ?? row.created_at),
      date: localDateKey(row.published_at ?? row.created_at),
      type: row.announcement_type ?? "general",
    }));
}

export async function fetchHolidays(): Promise<HolidayItem[]> {
  const { data, error } = await supabase
    .from("announcements")
    .select("id, title, published_at, created_at, expires_at, publish_status")
    .eq("announcement_type", "holiday");

  if (error) throw new Error(`Could not load holiday announcements: ${error.message}`);
  if (!data) return [];

  return data
    .filter((row) => {
      const startsAt = new Date(row.published_at ?? row.created_at).getTime();
      const endsAt = row.expires_at ? new Date(row.expires_at).getTime() : null;
      if (endsAt !== null && endsAt <= startsAt) return false;
      return true;
    })
    .map((row) => {
      const publishedAt = row.published_at ?? row.created_at;
      const endAt = row.expires_at;
      const startDate = localDateKey(publishedAt);
      const endDate = endAt ? localDateKey(endAt) : startDate;
      return {
        id: row.id,
        title: row.title,
        startDate,
        endDate,
        dates: dateRange(startDate, endDate),
        timeLabel: formatHolidayTimeRange(publishedAt, endAt),
      };
    });
}

export async function fetchHolidayDates(): Promise<string[]> {
  const holidays = await fetchHolidays();
  return [
    ...new Set(
      holidays.flatMap((holiday) => holiday.dates)
    ),
  ];
}
