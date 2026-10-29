import { getBarangays } from "@/lib/barangay/data";
import { getRoutes } from "@/lib/routes/data";
import { createClient } from "@/lib/supabase/server";
import { mapScheduleRow } from "@/lib/schedules/format";
import type { Schedule, ScheduleRouteOption } from "@/types/schedules";
import type { Route } from "@/types/routes";

/** Barangays listed in Barangay Management. */
export async function getScheduleBarangayOptions(): Promise<string[]> {
  const barangays = await getBarangays();
  return barangays.map((barangay) => barangay.name);
}

export async function getScheduleRouteOptions(): Promise<ScheduleRouteOption[]> {
  const routes = await getRoutes();
  return routes
    .filter((r) => r.status === "active" && !r.archivedAt)
    .map((r) => ({
      id: r.id,
      label: `${r.routeCode} — ${r.name}`,
      barangay: r.barangay,
      area: r.area,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export async function getSchedules(includeArchived = false): Promise<Schedule[]> {
  try {
    const supabase = await createClient();
    const [{ data, error }, routes] = await Promise.all([
      (() => {
        let query = supabase
          .from("collection_schedules")
          .select("*")
          .order("collection_date", { ascending: false });
        if (!includeArchived) query = query.is("archived_at", null);
        return query;
      })(),
      getRoutes(),
    ]);

    if (error || !data?.length) return [];

    const routeById = new Map<string, Route>(routes.map((r) => [r.id, r]));
    return data
      .map((row) =>
        mapScheduleRow(row, row.route_id ? routeById.get(row.route_id) : undefined)
      )
      .sort((a, b) => Number(Boolean(a.archivedAt)) - Number(Boolean(b.archivedAt)));
  } catch {
    return [];
  }
}
