import { supabase } from "../supabase";

export type RouteStopItem = {
  id: string;
  stopOrder: number;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  status: string;
};

export type DriverRoute = {
  id: string;
  routeCode: string;
  name: string;
  barangay: string;
  area: string;
  distanceKm: number;
  estimatedMinutes: number;
  driverName: string;
  vehicleId: string;
  stops: RouteStopItem[];
};

function matchDriver(rowDriver: string | null, driverName: string): boolean {
  if (!rowDriver) return false;
  const a = rowDriver.toLowerCase();
  const b = driverName.toLowerCase();
  return a.includes(b) || b.includes(a) || a.split(" ")[0] === b.split(" ")[0];
}

export function isStopCollected(status: string): boolean {
  return status === "completed";
}

export function getStopProgress(stops: RouteStopItem[]): {
  collected: number;
  total: number;
  percent: number;
} {
  const total = stops.length;
  const collected = stops.filter((s) => isStopCollected(s.status)).length;
  const percent = total > 0 ? Math.round((collected / total) * 100) : 0;
  return { collected, total, percent };
}

export function getNextStopIndex(stops: RouteStopItem[]): number {
  return stops.findIndex((s) => !isStopCollected(s.status));
}

export async function markStopCollected(stopId: string): Promise<string | null> {
  const { error } = await supabase
    .from("route_stops")
    .update({ status: "completed" })
    .eq("id", stopId);

  return error?.message ?? null;
}

export async function resetRouteStops(routeId: string): Promise<string | null> {
  const { data: stops, error } = await supabase
    .from("route_stops")
    .select("id, stop_order")
    .eq("route_id", routeId)
    .order("stop_order");

  if (error) return error.message;
  if (!stops?.length) return null;

  const lastOrder = stops[stops.length - 1].stop_order;

  for (const stop of stops) {
    let status = "pending";
    if (stop.stop_order === 1) status = "start";
    else if (stop.stop_order === lastOrder) status = "end";

    const { error: updateError } = await supabase
      .from("route_stops")
      .update({ status })
      .eq("id", stop.id);

    if (updateError) return updateError.message;
  }

  return null;
}

function mapRouteRow(
  route: Record<string, unknown>,
  stops: RouteStopItem[],
  driverName: string
): DriverRoute {
  return {
    id: route.id as string,
    routeCode: (route.route_code as string) ?? "R-001",
    name: route.name as string,
    barangay: (route.barangay as string) ?? route.name,
    area: (route.area as string) ?? (route.name as string),
    distanceKm: Number(route.distance_km ?? 0),
    estimatedMinutes: Number(route.estimated_minutes ?? 0),
    driverName: (route.driver_name as string) ?? driverName,
    vehicleId: (route.vehicle_id as string) ?? "VEH-001",
    stops,
  };
}

async function loadStopsForRoute(routeId: string): Promise<RouteStopItem[]> {
  const { data: stops } = await supabase
    .from("route_stops")
    .select("*")
    .eq("route_id", routeId)
    .order("stop_order");

  return (stops ?? []).map((s) => ({
    id: s.id,
    stopOrder: s.stop_order,
    name: s.name,
    description: s.description ?? "",
    latitude: Number(s.latitude),
    longitude: Number(s.longitude),
    status: s.status,
  }));
}

export async function fetchRouteForBarangay(
  barangay: string,
  driverName: string
): Promise<DriverRoute | null> {
  const { data: routes, error } = await supabase.from("routes").select("*");

  if (error || !routes?.length) return null;

  const target = barangay.trim().toLowerCase();

  const matched =
    routes.find((r) => {
      const areas = String(r.barangay ?? "")
        .split(",")
        .map((s) => s.trim().toLowerCase());
      return (
        areas.includes(target) ||
        String(r.area ?? "")
          .trim()
          .toLowerCase() === target
      );
    }) ?? routes.find((r) => matchDriver(r.driver_name, driverName));

  if (!matched) return null;

  const mappedStops = await loadStopsForRoute(matched.id);
  return mapRouteRow(matched, mappedStops, driverName);
}

export async function fetchDriverRoute(driverName: string): Promise<DriverRoute | null> {
  const { data: routes, error } = await supabase.from("routes").select("*");

  if (error || !routes?.length) return null;

  const route =
    routes.find((r) => matchDriver(r.driver_name, driverName)) ?? routes[0];

  const mappedStops = await loadStopsForRoute(route.id);
  return mapRouteRow(route, mappedStops, driverName);
}
