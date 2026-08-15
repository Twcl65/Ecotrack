import { createClient } from "@/lib/supabase/server";
import { buildFullName } from "@/lib/users/format";
import {
  buildFallbackStops,
  mapRouteRow,
  mapRouteStopRow,
} from "@/lib/routes/format";
import type { Route } from "@/types/routes";

const ROUTE_SELECT =
  "id, name, distance_km, status, created_at, route_code, barangay, area, driver_name, vehicle_id, estimated_minutes";

const ROUTE_SELECT_BASIC = "id, name, distance_km, status, created_at";

export async function getRoutes(): Promise<Route[]> {
  try {
    const supabase = await createClient();

    let routeRows: Record<string, unknown>[] | null = null;

    const extended = await supabase
      .from("routes")
      .select(ROUTE_SELECT)
      .order("route_code", { ascending: true, nullsFirst: false })
      .order("name", { ascending: true });

    if (!extended.error && extended.data?.length) {
      routeRows = extended.data;
    } else {
      const basic = await supabase
        .from("routes")
        .select(ROUTE_SELECT_BASIC)
        .order("name", { ascending: true });
      if (basic.error || !basic.data?.length) return [];
      routeRows = basic.data;
    }

    const { data: stopRows } = await supabase
      .from("route_stops")
      .select("*")
      .order("stop_order", { ascending: true });

    const stopsByRoute = new Map<string, ReturnType<typeof mapRouteStopRow>[]>();
    for (const row of stopRows ?? []) {
      const stop = mapRouteStopRow(row);
      const list = stopsByRoute.get(stop.routeId) ?? [];
      list.push(stop);
      stopsByRoute.set(stop.routeId, list);
    }

    return routeRows.map((row, index) => {
      const id = row.id as string;
      const dbStops = stopsByRoute.get(id) ?? [];
      const mapped = mapRouteRow(
        row as Parameters<typeof mapRouteRow>[0],
        index,
        dbStops
      );
      if (mapped.stops.length === 0) {
        mapped.stops = buildFallbackStops(id, row.name as string, mapped.area);
      }
      return mapped;
    });
  } catch {
    return [];
  }
}

export async function getDriverOptions(): Promise<string[]> {
  const names = new Set<string>();

  try {
    const supabase = await createClient();

    const { data: users } = await supabase
      .from("system_users")
      .select("first_name, middle_name, last_name")
      .eq("role", "driver")
      .eq("status", "active")
      .order("last_name");

    for (const user of users ?? []) {
      names.add(buildFullName(user.first_name, user.middle_name, user.last_name));
    }

    const { data: routes } = await supabase
      .from("routes")
      .select("driver_name")
      .not("driver_name", "is", null);

    for (const route of routes ?? []) {
      if (route.driver_name) names.add(route.driver_name);
    }

    const { data: schedules } = await supabase
      .from("collection_schedules")
      .select("driver")
      .not("driver", "is", null);

    for (const schedule of schedules ?? []) {
      if (schedule.driver) names.add(schedule.driver);
    }

    const { data: collections } = await supabase
      .from("collections")
      .select("driver_name")
      .not("driver_name", "is", null);

    for (const collection of collections ?? []) {
      if (collection.driver_name) names.add(collection.driver_name);
    }

    return [...names].sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}

export async function getBarangayOptions(): Promise<string[]> {
  const names = new Set<string>();

  try {
    const supabase = await createClient();

    const { data: barangays } = await supabase
      .from("barangays")
      .select("name")
      .eq("status", "active")
      .order("name");

    for (const row of barangays ?? []) {
      if (row.name) names.add(String(row.name));
    }

    const { data: routes } = await supabase.from("routes").select("barangay, area");
    for (const row of routes ?? []) {
      if (row.barangay) {
        String(row.barangay)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .forEach((s) => names.add(s));
      }
      if (row.area) names.add(String(row.area).trim());
    }

    return [...names].sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}

/** @deprecated Use getBarangayOptions */
export async function getBarangayOptionsFromRoutes(): Promise<string[]> {
  return getBarangayOptions();
}
