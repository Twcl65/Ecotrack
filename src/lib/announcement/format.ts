import type {
  Announcement,
  AnnouncementDisplayStatus,
  AnnouncementFormValues,
  AnnouncementType,
  PublishStatus,
} from "@/types/announcement";
import { ANNOUNCEMENT_TYPE_CONFIG } from "@/types/announcement";

export function formatAnnouncementDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatAnnouncementTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function toDateInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function toTimeInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
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
  return new Date(y, m - 1, d, hh, mm).toISOString();
}

export function defaultFormValues(): AnnouncementFormValues {
  const now = new Date();
  const date = toDateInputValue(now.toISOString());
  const time = toTimeInputValue(now.toISOString());
  return {
    title: "",
    type: "general",
    audience: "all_residents",
    message: "",
    publishDate: date,
    publishTime: time,
    expiryDate: "",
    expiryTime: "",
    publishStatus: "publish_now",
  };
}
