import { todayIso } from "../date";
import type { UserComplaint } from "./complaints";
import type { ScheduleItem } from "./schedules";
import type { DriverVehicleMaintenanceRequest } from "./vehicles";

export type NotificationItem = {
  id: string;
  title: string;
  detailTitle?: string;
  message: string;
  details: string;
  timestamp: string;
  type: "Collection" | "Complaint" | "Maintenance";
  tone: "reminder" | "complaint" | "maintenance";
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
    type: "Complaint" as const,
    tone: "complaint" as const,
  }));

  return [...complaintNotifications, ...collectionNotifications].slice(0, 20);
}

export function buildDriverNotifications(
  schedules: ScheduleItem[],
  maintenanceRequests: DriverVehicleMaintenanceRequest[] = []
): NotificationItem[] {
  const today = todayIso();
  const scheduleNotifications = schedules
    .filter(
      (schedule) =>
        schedule.date >= today &&
        !["no_collection", "canceled", "maintenance"].includes(schedule.status)
    )
    .map((schedule) => scheduleNotification(schedule, "Collection Schedule"));
  const maintenanceNotifications = maintenanceRequests
    .filter((request) => request.status !== "pending")
    .map((request) => {
      const status = request.status.replaceAll("_", " ");
      return {
        id: `vehicle-maintenance-${request.id}-${request.status}`,
        title: `Maintenance request ${status}`,
        detailTitle: request.requestType,
        message: `Your ${request.requestType.toLowerCase()} request was ${status}.`,
        details: [
          `Request: ${request.requestType}`,
          `Status: ${status}`,
          ...(request.scheduledMaintenanceDate
            ? [`Scheduled maintenance: ${new Date(`${request.scheduledMaintenanceDate}T00:00:00`).toLocaleDateString()}`]
            : []),
          "",
          request.description,
          ...(request.adminNote ? ["", `Admin note: ${request.adminNote}`] : []),
        ].join("\n"),
        timestamp: new Date(request.updatedAt).toLocaleString(),
        type: "Maintenance" as const,
        tone: "maintenance" as const,
      };
    });

  return [...maintenanceNotifications, ...scheduleNotifications].slice(0, 20);
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
    type: "Collection" as const,
    tone: "reminder",
  };
}
