export type RouteStatus = "active" | "inactive" | "completed";

export type RouteStopStatus = "start" | "pending" | "completed" | "end";

export type RouteStop = {
  id: string;
  routeId: string;
  stopOrder: number;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  status: RouteStopStatus;
};

export type Route = {
  id: string;
  routeCode: string;
  name: string;
  barangay: string;
  area: string;
  distanceKm: number;
  estimatedMinutes: number;
  driverName: string;
  vehicleId: string;
  status: RouteStatus;
  createdAt: string;
  stops: RouteStop[];
};

export type RouteStats = {
  totalRoutes: number;
  activeRoutes: number;
  totalDistanceKm: number;
  completedToday: number;
};

export type RouteFormStop = {
  clientId: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
};

export type RouteFormValues = {
  routeCode: string;
  name: string;
  barangay: string;
  area: string;
  distanceKm: string;
  estimatedMinutes: string;
  driverName: string;
  vehicleId: string;
  status: RouteStatus;
  stops: RouteFormStop[];
};

export const ROUTE_STATUS_OPTIONS: { value: RouteStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "completed", label: "Completed" },
];

export const ROUTE_CODE_COLORS = [
  "bg-emerald-100 text-emerald-800",
  "bg-blue-100 text-blue-800",
  "bg-violet-100 text-violet-800",
  "bg-amber-100 text-amber-800",
  "bg-rose-100 text-rose-800",
  "bg-cyan-100 text-cyan-800",
];

export function routeCodeColor(code: string): string {
  const num = parseInt(code.replace(/\D/g, ""), 10);
  if (Number.isNaN(num)) return ROUTE_CODE_COLORS[0];
  return ROUTE_CODE_COLORS[(num - 1) % ROUTE_CODE_COLORS.length];
}

export function formatEstimatedTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h <= 0) return `${m}m`;
  if (m <= 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatDistance(km: number): string {
  return `${km.toFixed(1)} km`;
}
