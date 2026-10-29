import { createClient } from "@/lib/supabase/server";
import { buildFullName } from "@/lib/users/format";
import {
  buildFallbackStops,
  mapRouteRow,
  mapRouteStopRow,
} from "@/lib/routes/format";
import type { Route } from "@/types/routes";

const ROUTE_SELECT =
  "id, name, distance_km, status, created_at, route_code, barangay, area, driver_name, estimated_minutes, archived_at";

const ROUTE_SELECT_BASIC = "id, name, distance_km, status, created_at, archived_at";

export async function getRoutes(includeArchived = false): Promise<Route[]> {
  try {
    const supabase = await createClient();

    let routeRows: Record<string, unknown>[] | null = null;

    let extendedQuery = supabase
      .from("routes")
      .select(ROUTE_SELECT)
      .order("created_at", { ascending: false });
    if (!includeArchived) extendedQuery = extendedQuery.is("archived_at", null);
    const extended = await extendedQuery;

    if (!extended.error && extended.data?.length) {
      routeRows = extended.data;
    } else {
      let basicQuery = supabase
        .from("routes")
        .select(ROUTE_SELECT_BASIC)
        .order("created_at", { ascending: false });
      if (!includeArchived) basicQuery = basicQuery.is("archived_at", null);
      const basic = await basicQuery;
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

    return routeRows
      .map((row, index) => {
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
      })
      .sort((a, b) => Number(Boolean(a.archivedAt)) - Number(Boolean(b.archivedAt)));
  } catch {
    return [];
  }
}

export async function getDriverOptions(): Promise<string[]> {
  const supabase = await createClient();
  const { data: users, error } = await supabase
    .from("system_users")
    .select("first_name, middle_name, last_name")
    .eq("role", "driver")
    .eq("status", "active")
    .is("archived_at", null)
    .order("last_name");

  if (error) {
    throw new Error(`Could not load active drivers: ${error.message}`);
  }

  return [...new Set(
    (users ?? [])
      .map((user) => buildFullName(user.first_name, user.middle_name, user.last_name))
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b));
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

    const { data: routes } = await supabase
      .from("routes")
      .select("barangay, area")
      .is("archived_at", null);
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
