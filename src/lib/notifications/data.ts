import { getAnnouncements } from "@/lib/announcement/data";
import { getComplaints } from "@/lib/complaint/data";
import { buildAdminNotifications } from "@/lib/notifications/build";
import { getSchedules } from "@/lib/schedules/data";
import { createClient } from "@/lib/supabase/server";
import type { AdminNotification } from "@/types/notifications";

async function getPendingMaintenanceNotifications(): Promise<AdminNotification[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vehicle_maintenance_requests")
    .select("id, driver_name, request_type, requested_at")
    .eq("status", "pending")
    .order("requested_at", { ascending: false })
    .limit(10);

  if (error) {
    throw new Error(`Could not load vehicle maintenance notifications: ${error.message}`);
  }

  return (data ?? []).map((request) => ({
    id: `vehicle-maintenance-${request.id}`,
    title: "Vehicle maintenance requested",
    message: `${request.driver_name} requested ${request.request_type.toLowerCase()}.`,
    timeLabel: new Date(request.requested_at).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }),
    tone: "maintenance",
    href: "/dashboard/vehicles",
  }));
}

export async function getAdminNotifications(): Promise<AdminNotification[]> {
  try {
    const [complaints, schedules, announcements, maintenance] = await Promise.all([
      getComplaints(),
      getSchedules(),
      getAnnouncements(),
      getPendingMaintenanceNotifications(),
    ]);

    return [
      ...maintenance,
      ...buildAdminNotifications(complaints, schedules, announcements),
    ].slice(0, 20);
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
