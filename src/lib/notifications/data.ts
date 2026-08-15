import { getAnnouncements } from "@/lib/announcement/data";
import { getComplaints } from "@/lib/complaint/data";
import { buildAdminNotifications } from "@/lib/notifications/build";
import { getSchedules } from "@/lib/schedules/data";
import type { AdminNotification } from "@/types/notifications";

export async function getAdminNotifications(): Promise<AdminNotification[]> {
  try {
    const [complaints, schedules, announcements] = await Promise.all([
      getComplaints(),
      getSchedules(),
      getAnnouncements(),
    ]);

    return buildAdminNotifications(complaints, schedules, announcements);
  } catch {
    return [
      {
        id: "info-error",
        title: "Notifications unavailable",
        message: "Could not load alerts. Please refresh the page.",
        timeLabel: "Now",
        tone: "info",
      },
    ];
  }
}
