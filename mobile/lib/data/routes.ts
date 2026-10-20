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
  stops: RouteStopItem[];
};

export type RouteDirection = "North" | "South" | "East" | "West";

const JASAAN_CENTER = { latitude: 8.653, longitude: 124.753 };
const BARANGAY_DIRECTIONS: Record<string, RouteDirection> = {
  "upper jasaan": "North",
  solana: "North",
  "lower jasaan": "South",
  aplaya: "South",
  "san antonio": "East",
  macajalar: "West",
};

export function getRouteDirection(
  route: DriverRoute,
  collectionArea: string
): RouteDirection {
  const areas = [
    collectionArea,
    route.area,
    route.name,
    ...route.barangay.split(","),
  ];
  for (const area of areas) {
    const normalized = area.trim().toLowerCase().replace(/\s+route$/, "");
    const direction = BARANGAY_DIRECTIONS[normalized];
    if (direction) return direction;
  }

  if (route.stops.length === 0) return "North";
  const latitude =
    route.stops.reduce((total, stop) => total + stop.latitude, 0) /
    route.stops.length;
  const longitude =
    route.stops.reduce((total, stop) => total + stop.longitude, 0) /
    route.stops.length;
  const latitudeOffset = latitude - JASAAN_CENTER.latitude;
  const longitudeOffset = longitude - JASAAN_CENTER.longitude;
  return Math.abs(latitudeOffset) >= Math.abs(longitudeOffset)
    ? latitudeOffset >= 0
      ? "North"
      : "South"
    : longitudeOffset >= 0
      ? "East"
      : "West";
}

export function formatRouteName(routeName: string): string {
  const name = routeName.trim().replace(/\s+route$/i, "");
  return `${name} Route`;
}

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

export function isStopNearLocationPath(
  stop: RouteStopItem,
  previous: { latitude: number; longitude: number } | null,
  current: { latitude: number; longitude: number },
  radiusMeters = 50
): boolean {
  const earthRadiusMeters = 6_371_000;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeRadians = toRadians(stop.latitude);
  const toPoint = (point: { latitude: number; longitude: number }) => ({
    x:
      earthRadiusMeters *
      toRadians(point.longitude - stop.longitude) *
      Math.cos(latitudeRadians),
    y: earthRadiusMeters * toRadians(point.latitude - stop.latitude),
  });

  const currentPoint = toPoint(current);
  if (!previous) {
    return Math.hypot(currentPoint.x, currentPoint.y) <= radiusMeters;
  }

  const previousPoint = toPoint(previous);
  const segmentX = currentPoint.x - previousPoint.x;
  const segmentY = currentPoint.y - previousPoint.y;
  const segmentLengthSquared = segmentX * segmentX + segmentY * segmentY;
  const projection =
    segmentLengthSquared === 0
      ? 0
      : Math.max(
          0,
          Math.min(
            1,
            -(previousPoint.x * segmentX + previousPoint.y * segmentY) /
              segmentLengthSquared
          )
        );
  const closestX = previousPoint.x + projection * segmentX;
  const closestY = previousPoint.y + projection * segmentY;

  return Math.hypot(closestX, closestY) <= radiusMeters;
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

  const matchesBarangay = (r: (typeof routes)[number]) => {
      const areas = String(r.barangay ?? "")
        .split(",")
        .map((s) => s.trim().toLowerCase());
      return (
        areas.includes(target) ||
        String(r.area ?? "")
          .trim()
          .toLowerCase() === target
      );
    };

  const matched =
    routes.find((r) => matchDriver(r.driver_name, driverName) && matchesBarangay(r)) ??
    routes.find((r) => !r.driver_name && matchesBarangay(r));

  if (!matched) return null;

  const mappedStops = await loadStopsForRoute(matched.id);
  return mapRouteRow(matched, mappedStops, driverName);
}

export async function fetchRouteById(
  routeId: string,
  driverName: string
): Promise<DriverRoute | null> {
  const { data: route, error } = await supabase
    .from("routes")
    .select("*")
    .eq("id", routeId)
    .maybeSingle();
  if (error) throw new Error(`Could not load the assigned route: ${error.message}`);
  if (!route) return null;
  const mappedStops = await loadStopsForRoute(route.id);
  return mapRouteRow(route, mappedStops, driverName);
}

export async function fetchDriverRoute(driverName: string): Promise<DriverRoute | null> {
  const { data: routes, error } = await supabase.from("routes").select("*");

  if (error || !routes?.length) return null;

  const route = routes.find((r) => matchDriver(r.driver_name, driverName));
  if (!route) return null;

  const mappedStops = await loadStopsForRoute(route.id);
  return mapRouteRow(route, mappedStops, driverName);
}
