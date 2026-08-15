import type { Announcement } from "@/types/announcement";
import type { Complaint } from "@/types/complaint";
import type { AdminNotification } from "@/types/notifications";
import type { Schedule } from "@/types/schedules";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function truncate(text: string, max = 90): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}…`;
}

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function buildAdminNotifications(
  complaints: Complaint[],
  schedules: Schedule[],
  announcements: Announcement[]
): AdminNotification[] {
  const items: AdminNotification[] = [];
  const today = todayIso();

  const pendingComplaints = complaints
    .filter((c) => c.status === "pending" || c.status === "in_progress")
    .slice(0, 4);

  for (const c of pendingComplaints) {
    items.push({
      id: `complaint-${c.id}`,
      title:
        c.status === "pending"
          ? `New Complaint — ${c.complaintCode}`
          : `Complaint In Progress — ${c.complaintCode}`,
      message: truncate(`${c.barangay}: ${c.issue}`),
      timeLabel: formatRelativeTime(c.filedAt),
      tone: "complaint",
      href: "/dashboard/complaint",
    });
  }

  const todayCollections = schedules.filter(
    (s) =>
      s.date === today &&
      s.status !== "no_collection" &&
      s.status !== "maintenance" &&
      s.status !== "canceled"
  );

  for (const s of todayCollections) {
    items.push({
      id: `collection-${s.id}`,
      title:
        s.status === "ongoing"
          ? "Collection In Progress"
          : s.status === "completed"
            ? "Collection Completed"
            : "Collection Scheduled Today",
      message: `${s.barangay} — ${s.timeStart ?? "TBD"} to ${s.timeEnd ?? "TBD"}`,
      timeLabel: s.dateLabel,
      tone: "collection",
      href: "/dashboard/collection",
    });
  }

  const upcoming = schedules
    .filter((s) => s.date > today && s.status === "pending")
    .slice(0, 3);

  for (const s of upcoming) {
    items.push({
      id: `schedule-${s.id}`,
      title: "Upcoming Collection",
      message: `${s.barangay} on ${s.dateLabel}`,
      timeLabel: s.dateLabel,
      tone: "schedule",
      href: "/dashboard/schedules",
    });
  }

  const recentAnnouncements = announcements
    .filter((a) => a.status === "active" || a.status === "scheduled")
    .slice(0, 3);

  for (const a of recentAnnouncements) {
    items.push({
      id: `announcement-${a.id}`,
      title: a.title,
      message: truncate(a.content),
      timeLabel: a.postedDateLabel || formatRelativeTime(a.created_at),
      tone: "announcement",
      href: "/dashboard/announcement",
    });
  }

  if (items.length === 0) {
    items.push({
      id: "info-empty",
      title: "All caught up",
      message: "No new alerts right now. Check back later for updates.",
      timeLabel: "Now",
      tone: "info",
    });
  }

  return items.slice(0, 12);
}
