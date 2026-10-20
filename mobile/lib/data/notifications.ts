import { todayIso } from "../date";
import type { UserComplaint } from "./complaints";
import type { ScheduleItem } from "./schedules";

export type NotificationItem = {
  id: string;
  title: string;
  detailTitle?: string;
  message: string;
  details: string;
  timestamp: string;
  tone: "reminder" | "complaint";
};

export function buildNotifications(
  schedules: ScheduleItem[],
  complaints: UserComplaint[]
): NotificationItem[] {
  const today = todayIso();
  const collectionNotifications = schedules
    .filter(
      (schedule) =>
        schedule.date >= today &&
        !["no_collection", "canceled", "maintenance"].includes(schedule.status)
    )
    .map((schedule) => scheduleNotification(schedule, "Collection Reminder"));

  const complaintNotifications = complaints.map((complaint) => ({
    id: `complaint-${complaint.id}-${complaint.status}`,
    title: `Complaint ${complaint.statusLabel}`,
    detailTitle: complaint.complaintCode,
    message: `${complaint.issue} · ${complaint.statusLabel}`,
    details: [
      `Complaint: ${complaint.complaintCode}`,
      `Barangay: ${complaint.barangay}`,
      `Status: ${complaint.statusLabel}`,
      `Filed: ${complaint.dateLabel} at ${complaint.timeLabel}`,
      "",
      complaint.issue,
    ].join("\n"),
    timestamp: `${complaint.dateLabel} · ${complaint.timeLabel}`,
    tone: "complaint" as const,
  }));

  return [...complaintNotifications, ...collectionNotifications].slice(0, 20);
}

export function buildDriverNotifications(
  schedules: ScheduleItem[]
): NotificationItem[] {
  const today = todayIso();
  return schedules
    .filter(
      (schedule) =>
        schedule.date >= today &&
        !["no_collection", "canceled", "maintenance"].includes(schedule.status)
    )
    .map((schedule) => scheduleNotification(schedule, "Collection Schedule"))
    .slice(0, 20);
}

function scheduleNotification(
  schedule: ScheduleItem,
  title: string
): NotificationItem {
  return {
    id: `sched-${schedule.id}`,
    title,
    detailTitle: `${schedule.barangay} Collection`,
    message: `Collection in ${schedule.barangay} on ${schedule.dateLabel}`,
    details: [
      `Barangay: ${schedule.barangay}`,
      `Date: ${schedule.dateLabel} (${schedule.dayLabel})`,
      `Collection time: ${schedule.timeStart ?? "To be determined"}`,
      `Status: ${schedule.status.replaceAll("_", " ")}`,
    ].join("\n"),
    timestamp: `${schedule.dateLabel} · ${schedule.timeStart ?? "Time TBD"}`,
    tone: "reminder",
  };
}
