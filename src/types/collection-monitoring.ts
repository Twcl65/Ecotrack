import type { Schedule, ScheduleStatus } from "@/types/schedules";
import type { RouteStopStatus } from "@/types/routes";
import type { Route } from "@/types/routes";

export type CollectionMonitoringKpis = {
  todaysCollection: number;
  inProgress: number;
  upcoming: number;
  totalRoutes: number;
};

export type CollectionProgressSlice = {
  status: ScheduleStatus | "cancelled";
  label: string;
  count: number;
  color: string;
};

export type CollectionSummary = {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  cancelled: number;
  wasteKg: number;
};

export type CollectionActivity = {
  id: string;
  tone: "success" | "info" | "warning";
  message: string;
  timeLabel: string;
};

export type CollectionMapMarker = {
  barangay: string;
  x: number;
  y: number;
  status: ScheduleStatus;
};

export type CollectionRouteStop = {
  stopOrder: number;
  name: string;
  latitude: number;
  longitude: number;
  status: RouteStopStatus;
};

export type CollectionRouteOverlay = {
  scheduleId: string;
  barangay: string;
  driver: string | null;
  status: ScheduleStatus;
  routeName: string;
  routeCode: string;
  stops: CollectionRouteStop[];
};

export type CollectionMonitoringData = {
  schedules: Schedule[];
  routes: Route[];
  routesCount: number;
  wasteCollectedKg: number;
  barangayOptions: string[];
  driverOptions: string[];
};

export const BARANGAY_MAP_COORDS: Record<string, { x: number; y: number }> = {
  "Upper Jasaan": { x: 72, y: 22 },
  Nahalinan: { x: 48, y: 38 },
  Kimaya: { x: 42, y: 52 },
  "Lower Jasaan": { x: 62, y: 58 },
  Solana: { x: 56, y: 28 },
  Aplaya: { x: 28, y: 68 },
  Bubontogan: { x: 38, y: 44 },
  "San Antonio": { x: 78, y: 48 },
  Macajalar: { x: 34, y: 32 },
  Maintenance: { x: 50, y: 50 },
  Jampason: { x: 58, y: 62 },
};
