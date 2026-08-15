export type NotificationTone =
  | "complaint"
  | "schedule"
  | "announcement"
  | "collection"
  | "info";

export type AdminNotification = {
  id: string;
  title: string;
  message: string;
  timeLabel: string;
  tone: NotificationTone;
  href?: string;
};

export const NOTIFICATION_TONE_STYLES: Record<
  NotificationTone,
  { iconBg: string; iconColor: string }
> = {
  complaint: { iconBg: "bg-red-100", iconColor: "text-red-600" },
  schedule: { iconBg: "bg-amber-100", iconColor: "text-amber-600" },
  announcement: { iconBg: "bg-blue-100", iconColor: "text-blue-600" },
  collection: { iconBg: "bg-emerald-100", iconColor: "text-emerald-600" },
  info: { iconBg: "bg-gray-100", iconColor: "text-gray-600" },
};
