import type {
  Announcement,
  AnnouncementDisplayStatus,
  AnnouncementFormValues,
  AnnouncementType,
  PublishStatus,
} from "@/types/announcement";
import { ANNOUNCEMENT_TYPE_CONFIG } from "@/types/announcement";

const APP_TIME_ZONE = "Asia/Manila";

function dateParts(iso: string): Record<string, string> {
  return Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: APP_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date(iso))
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );
}

export function formatAnnouncementDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: APP_TIME_ZONE,
  });
}

export function formatAnnouncementTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: APP_TIME_ZONE,
  });
}

export function toDateInputValue(iso: string | null): string {
  if (!iso) return "";
  const parts = dateParts(iso);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function toTimeInputValue(iso: string | null): string {
  if (!iso) return "";
  const parts = dateParts(iso);
  return `${parts.hour}:${parts.minute}`;
}

export function resolveDisplayStatus(
  publishedAt: string | null,
  expiresAt: string | null,
  publishStatus: PublishStatus
): AnnouncementDisplayStatus {
  const now = Date.now();
  if (expiresAt && new Date(expiresAt).getTime() < now) return "expired";
  if (
    publishStatus === "scheduled" &&
    publishedAt &&
    new Date(publishedAt).getTime() > now
  ) {
    return "scheduled";
  }
  return "active";
}

export function mapAnnouncementRow(row: {
  id: string;
  title: string;
  subtitle?: string | null;
  content: string;
  announcement_type?: string | null;
  audience?: string | null;
  publish_status?: string | null;
  published_at?: string | null;
  expires_at?: string | null;
  archived_at?: string | null;
  views?: number | null;
  created_at: string;
  updated_at?: string | null;
}): Announcement {
  const type = (row.announcement_type ?? "general") as AnnouncementType;
  const publishStatus = (row.publish_status ?? "publish_now") as PublishStatus;
  const publishedAt = row.published_at ?? row.created_at;
  const expiresAt = row.expires_at ?? null;
  const status = resolveDisplayStatus(publishedAt, expiresAt, publishStatus);
  const subtitle =
    row.subtitle?.trim() || ANNOUNCEMENT_TYPE_CONFIG[type].subtitle;

  return {
    id: row.id,
    title: row.title,
    subtitle,
    content: row.content,
    type,
    audience: (row.audience ?? "all_residents") as Announcement["audience"],
    publishStatus,
    status,
    archivedAt: row.archived_at ?? null,
    publishedAt,
    expiresAt,
    views: row.views ?? 0,
    postedDateLabel: formatAnnouncementDate(publishedAt),
    postedTimeLabel: formatAnnouncementTime(publishedAt),
    expiryDateLabel: expiresAt ? formatAnnouncementDate(expiresAt) : null,
    expiryTimeLabel: expiresAt ? formatAnnouncementTime(expiresAt) : null,
    created_at: row.created_at,
    updated_at: row.updated_at ?? row.created_at,
  };
}

export function announcementToFormValues(
  announcement: Announcement
): AnnouncementFormValues {
  return {
    title: announcement.title,
    type: announcement.type,
    audience: announcement.audience,
    message: announcement.content,
    publishDate: toDateInputValue(announcement.publishedAt),
    publishTime: toTimeInputValue(announcement.publishedAt),
    expiryDate: toDateInputValue(announcement.expiresAt),
    expiryTime: toTimeInputValue(announcement.expiresAt),
    publishStatus: announcement.publishStatus,
  };
}

export function formValuesToTimestamp(
  date: string,
  time: string
): string | null {
  if (!date) return null;
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = (time || "00:00").split(":").map(Number);
  const localTimestamp = `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}T${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:00+08:00`;
  return new Date(localTimestamp).toISOString();
}

export function defaultFormValues(): AnnouncementFormValues {
  const now = new Date();
  const parts = dateParts(now.toISOString());
  const date = `${parts.year}-${parts.month}-${parts.day}`;
  const time = `${parts.hour}:${parts.minute}`;
  return {
    title: "",
    type: "general",
    audience: "all_residents",
    message: "",
    publishDate: date,
    publishTime: time,
    expiryDate: "",
    expiryTime: "",
    publishStatus: "scheduled",
  };
}
