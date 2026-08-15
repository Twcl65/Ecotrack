import type { Route, RouteStatus, RouteStop, RouteStopStatus } from "@/types/routes";

const DRIVERS = [
  "Juan Dela Cruz",
  "Maria Santos",
  "Pedro Reyes",
  "Ana Garcia",
  "Carlos Mendoza",
  "Rosa Villanueva",
];

const AREAS: Record<string, { barangay: string; area: string }> = {
  "Upper Jasaan Route": { barangay: "Upper Jasaan, Nahalinan", area: "Upper Jasaan" },
  "San Antonio Route": { barangay: "San Antonio, Macajalar", area: "San Antonio" },
  "Solana Route": { barangay: "Solana, Bubontogan", area: "Solana" },
  "Aplaya Route": { barangay: "Aplaya, Lower Jasaan", area: "Aplaya" },
  "Jasaan Central Route": { barangay: "Jasaan Central, Lower Jasaan", area: "Jasaan Central" },
  "Macajalar Route": { barangay: "Macajalar, Nahalinan", area: "Macajalar" },
};

const JASAAN_STOPS: Omit<RouteStop, "id" | "routeId">[] = [
  { stopOrder: 1, name: "Upper Jasaan Barangay Hall", description: "Start point", latitude: 8.6548, longitude: 124.7542, status: "start" },
  { stopOrder: 2, name: "Purok 1, Upper Jasaan", description: "Residential Area", latitude: 8.6556, longitude: 124.7558, status: "pending" },
  { stopOrder: 3, name: "Purok 2, Upper Jasaan", description: "Residential Area", latitude: 8.6564, longitude: 124.7572, status: "pending" },
  { stopOrder: 4, name: "Upper Jasaan Market", description: "Commercial Area", latitude: 8.6571, longitude: 124.7585, status: "pending" },
  { stopOrder: 5, name: "Nahalinan Crossing", description: "Intersection", latitude: 8.6523, longitude: 124.7598, status: "pending" },
  { stopOrder: 6, name: "Nahalinan Elementary", description: "School Zone", latitude: 8.651, longitude: 124.7612, status: "pending" },
  { stopOrder: 7, name: "Purok 3, Nahalinan", description: "Residential Area", latitude: 8.6498, longitude: 124.7625, status: "pending" },
  { stopOrder: 8, name: "Nahalinan Chapel", description: "Community Area", latitude: 8.6485, longitude: 124.7638, status: "pending" },
  { stopOrder: 9, name: "Nahalinan Health Center", description: "Public Facility", latitude: 8.6472, longitude: 124.765, status: "pending" },
  { stopOrder: 10, name: "Purok 4, Nahalinan", description: "Residential Area", latitude: 8.646, longitude: 124.7662, status: "pending" },
  { stopOrder: 11, name: "Nahalinan Plaza", description: "Public Area", latitude: 8.6448, longitude: 124.7675, status: "pending" },
  { stopOrder: 12, name: "Nahalinan Public Market", description: "End point", latitude: 8.6435, longitude: 124.7688, status: "end" },
];

function vehicleForIndex(index: number): string {
  return `VEH-${String(index + 1).padStart(3, "0")}`;
}

function routeCodeForIndex(index: number): string {
  return `R-${String(index + 1).padStart(3, "0")}`;
}

function estimateMinutes(distanceKm: number): number {
  return Math.round((distanceKm / 28.6) * 205);
}

export function mapRouteStopRow(row: {
  id: string;
  route_id: string;
  stop_order: number;
  name: string;
  description: string | null;
  latitude: number | string;
  longitude: number | string;
  status: string;
}): RouteStop {
  return {
    id: row.id,
    routeId: row.route_id,
    stopOrder: row.stop_order,
    name: row.name,
    description: row.description ?? "",
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    status: row.status as RouteStopStatus,
  };
}

export function mapRouteRow(
  row: {
    id: string;
    name: string;
    distance_km: number | string;
    status: string;
    created_at: string;
    route_code?: string | null;
    barangay?: string | null;
    area?: string | null;
    driver_name?: string | null;
    vehicle_id?: string | null;
    estimated_minutes?: number | null;
  },
  index: number,
  stops: RouteStop[] = []
): Route {
  const meta = AREAS[row.name] ?? {
    barangay: row.barangay ?? row.name,
    area: row.area ?? row.name.replace(/ Route$/, ""),
  };
  const distanceKm = Number(row.distance_km);

  return {
    id: row.id,
    routeCode: row.route_code ?? routeCodeForIndex(index),
    name: row.name.replace(/ Route$/, "").replace(/^Route \d+ - /, "") || row.name,
    barangay: row.barangay ?? meta.barangay,
    area: row.area ?? meta.area,
    distanceKm,
    estimatedMinutes: row.estimated_minutes ?? estimateMinutes(distanceKm),
    driverName: row.driver_name ?? DRIVERS[index % DRIVERS.length],
    vehicleId: row.vehicle_id ?? vehicleForIndex(index),
    status: row.status as RouteStatus,
    createdAt: row.created_at,
    stops,
  };
}

export function buildFallbackStops(routeId: string, routeName: string, area: string): RouteStop[] {
  if (routeName.includes("Upper Jasaan") || area === "Upper Jasaan") {
    return JASAAN_STOPS.map((s, i) => ({
      ...s,
      id: `${routeId}-stop-${i + 1}`,
      routeId,
    }));
  }

  const baseLat = 8.6543 + (routeId.charCodeAt(0) % 10) * 0.001;
  const baseLng = 124.755 + (routeId.charCodeAt(1) % 10) * 0.001;

  return [
    {
      id: `${routeId}-stop-1`,
      routeId,
      stopOrder: 1,
      name: `${area} Barangay Hall`,
      description: "Start point",
      latitude: baseLat,
      longitude: baseLng,
      status: "start",
    },
    {
      id: `${routeId}-stop-2`,
      routeId,
      stopOrder: 2,
      name: `Purok 1, ${area}`,
      description: "Residential Area",
      latitude: baseLat + 0.001,
      longitude: baseLng + 0.0015,
      status: "pending",
    },
    {
      id: `${routeId}-stop-3`,
      routeId,
      stopOrder: 3,
      name: `${area} Public Market`,
      description: "End point",
      latitude: baseLat + 0.002,
      longitude: baseLng + 0.003,
      status: "end",
    },
  ];
}

export function formValuesToRow(values: {
  routeCode: string;
  name: string;
  barangay: string;
  area: string;
  distanceKm: string;
  estimatedMinutes: string;
  driverName: string;
  vehicleId: string;
  status: RouteStatus;
}) {
  return {
    route_code: values.routeCode.trim(),
    name: values.name.trim(),
    barangay: values.barangay.trim(),
    area: values.area.trim(),
    distance_km: parseFloat(values.distanceKm) || 0,
    estimated_minutes: parseInt(values.estimatedMinutes, 10) || 0,
    driver_name: values.driverName.trim(),
    vehicle_id: values.vehicleId.trim(),
    status: values.status,
  };
}

export function stopsToRows(
  routeId: string,
  stops: { name: string; description: string; latitude: number; longitude: number }[]
) {
  const total = stops.length;
  return stops.map((stop, index) => {
    const order = index + 1;
    let status: RouteStopStatus = "pending";
    if (order === 1) status = "start";
    else if (order === total && total > 1) status = "end";

    return {
      route_id: routeId,
      stop_order: order,
      name: stop.name.trim(),
      description: stop.description.trim() || null,
      latitude: stop.latitude,
      longitude: stop.longitude,
      status,
    };
  });
}

export function routeToFormValues(route: Route) {
  return {
    routeCode: route.routeCode,
    name: route.name,
    barangay: route.barangay,
    area: route.area,
    distanceKm: String(route.distanceKm),
    estimatedMinutes: String(route.estimatedMinutes),
    driverName: route.driverName,
    vehicleId: route.vehicleId,
    status: route.status,
    stops: route.stops.map((s) => ({
      clientId: s.id,
      name: s.name,
      description: s.description,
      latitude: s.latitude,
      longitude: s.longitude,
    })),
  };
}
