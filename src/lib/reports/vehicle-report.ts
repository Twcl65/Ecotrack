import type { VehicleMaintenanceData } from "@/app/dashboard/report/vehicle-actions";
import type { ReportFilters } from "@/types/reports";
import type { Route } from "@/types/routes";
import type { Schedule } from "@/types/schedules";

export type VehicleDriverReportRow = {
  driver: string;
  routes: Route[];
  completedRuns: number;
  estimatedKilometers: number;
  totalTravelMinutes: number;
  maintenanceSchedules: string[];
  lastMaintenanceDate: string | null;
  nextMaintenanceDate: string | null;
  history: { id: string; serviceDate: string; description: string }[];
};

export function getVehicleDriverReportRows(
  routes: Route[],
  schedules: Schedule[],
  maintenance: VehicleMaintenanceData[],
  filters: Pick<ReportFilters, "fromDate" | "toDate" | "barangay">
    | { fromDate: string; toDate: string; barangay: string }
): VehicleDriverReportRow[] {
  const routesInReport = routes.filter(
    (route) =>
      !route.archivedAt &&
      (filters.barangay === "all" ||
        route.barangay
          .split(",")
          .map((barangay) => barangay.trim())
          .includes(filters.barangay))
  );
  const routeIds = new Set(routesInReport.map((route) => route.id));
  const completedByRoute = new Map<string, Schedule[]>();

  schedules.forEach((schedule) => {
    if (
      schedule.archivedAt ||
      schedule.status !== "completed" ||
      schedule.date < filters.fromDate ||
      schedule.date > filters.toDate ||
      !schedule.routeId ||
      !routeIds.has(schedule.routeId)
    ) {
      return;
    }
    const entries = completedByRoute.get(schedule.routeId) ?? [];
    entries.push(schedule);
    completedByRoute.set(schedule.routeId, entries);
  });

  const maintenanceByRoute = new Map(
    maintenance.map((entry) => [entry.routeId, entry])
  );
  const rowsByDriver = new Map<string, VehicleDriverReportRow>();

  routesInReport.forEach((route) => {
    const routeSchedules = completedByRoute.get(route.id) ?? [];
    const driver =
      route.driverName.trim() ||
      routeSchedules.find((schedule) => schedule.driver?.trim())?.driver?.trim() ||
      "—";
    const driverKey = driver.toLocaleLowerCase();
    const maintenanceRecord = maintenanceByRoute.get(route.id);
    const row = rowsByDriver.get(driverKey) ?? {
      driver,
      routes: [],
      completedRuns: 0,
      estimatedKilometers: 0,
      totalTravelMinutes: 0,
      maintenanceSchedules: [],
      lastMaintenanceDate: null,
      nextMaintenanceDate: null,
      history: [],
    };

    row.routes.push(route);
    row.completedRuns += routeSchedules.length;
    row.estimatedKilometers += routeSchedules.length * route.distanceKm;
    row.totalTravelMinutes += routeSchedules.length * route.estimatedMinutes;

    if (maintenanceRecord) {
      const vehicleLabel = route.vehicleId || route.routeCode;
      if (maintenanceRecord.maintenanceSchedule) {
        row.maintenanceSchedules.push(
          `${vehicleLabel}: ${maintenanceRecord.maintenanceSchedule}`
        );
      }
      if (
        maintenanceRecord.nextMaintenanceDate &&
        (!row.nextMaintenanceDate ||
          maintenanceRecord.nextMaintenanceDate < row.nextMaintenanceDate)
      ) {
        row.nextMaintenanceDate = maintenanceRecord.nextMaintenanceDate;
      }
      maintenanceRecord.history.forEach((entry) => {
        row.history.push({
          id: entry.id,
          serviceDate: entry.serviceDate,
          description: `${vehicleLabel}: ${entry.description}`,
        });
        if (
          !row.lastMaintenanceDate ||
          entry.serviceDate > row.lastMaintenanceDate
        ) {
          row.lastMaintenanceDate = entry.serviceDate;
        }
      });
    }

    rowsByDriver.set(driverKey, row);
  });

  return [...rowsByDriver.values()].sort((a, b) =>
    a.driver.localeCompare(b.driver)
  );
}
