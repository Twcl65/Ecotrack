import { todayIso } from "../date";
import type { AnnouncementItem } from "./announcements";
import type { ScheduleItem } from "./schedules";

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  tone: "reminder" | "announcement" | "holiday" | "thanks";
};

export function buildNotifications(
  schedules: ScheduleItem[],
  announcements: AnnouncementItem[]
): NotificationItem[] {
  const items: NotificationItem[] = [];
  const next = schedules.find(
    (s) => s.status !== "no_collection" && s.status !== "canceled"
  );

  if (next) {
    items.push({
      id: `sched-${next.id}`,
      title: "Collection Reminder",
      message: `Your collection in ${next.barangay} is on ${next.dateLabel}`,
      timestamp: `${next.dayLabel}, ${next.timeStart ?? "TBD"}`,
      tone: "reminder",
    });
  }

  announcements.slice(0, 3).forEach((a, i) => {
    items.push({
      id: `ann-${a.id}`,
      title: a.title.includes("Holiday") ? "Holiday Notice" : "New Announcement",
      message: a.content.length > 80 ? `${a.content.slice(0, 80)}…` : a.content,
      timestamp: a.dateLabel,
      tone: a.title.includes("Holiday") ? "holiday" : "announcement",
    });
  });

  items.push({
    id: "thanks-1",
    title: "Thank You",
    message: "Thank you for keeping Jasaan clean.",
    timestamp: new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
    tone: "thanks",
  });

  return items.slice(0, 6);
}

export function buildDriverNotifications(
  schedules: ScheduleItem[],
  announcements: AnnouncementItem[],
  routeName?: string | null
): NotificationItem[] {
  const items: NotificationItem[] = [];
  const today = todayIso();
  const upcoming = schedules.find(
    (s) => s.date >= today && s.status === "pending"
  );

  if (upcoming) {
    items.push({
      id: `new-sched-${upcoming.id}`,
      title: "New Schedule",
      message: `You have a collection in ${upcoming.barangay} on ${upcoming.dateLabel}`,
      timestamp: `${upcoming.dayLabel}, ${upcoming.timeStart ?? "TBD"}`,
      tone: "reminder",
    });
  }

  if (routeName) {
    items.push({
      id: "route-updated",
      title: "Route Updated",
      message: `Your route (${routeName}) has been updated.`,
      timestamp: new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      tone: "announcement",
    });
  }

  announcements.slice(0, 4).forEach((a) => {
    const isHoliday = a.title.toLowerCase().includes("holiday");
    items.push({
      id: `ann-${a.id}`,
      title: isHoliday ? "Holiday Notice" : a.title,
      message: a.content.length > 90 ? `${a.content.slice(0, 90)}…` : a.content,
      timestamp: a.dateLabel,
      tone: isHoliday ? "holiday" : "announcement",
    });
  });

  const completed = schedules.find((s) => s.status === "completed");
  if (completed) {
    items.push({
      id: `done-${completed.id}`,
      title: "Collection Completed",
      message: `${completed.barangay} collection completed`,
      timestamp: completed.dateLabel,
      tone: "thanks",
    });
  }

  items.push({
    id: "ppe-reminder",
    title: "Reminder",
    message: "Don't forget your PPE before starting collection.",
    timestamp: new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
    tone: "reminder",
  });

  return items.slice(0, 12);
}
