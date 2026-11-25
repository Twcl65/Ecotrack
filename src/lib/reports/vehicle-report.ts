import { parseScheduleBarangays } from "@/lib/schedules/format";
import type { ReportFilters } from "@/types/reports";
import type { Schedule } from "@/types/schedules";
import type { Vehicle } from "@/types/vehicles";

export type VehicleReportRow = {
  vehicle: Vehicle;
  completedSchedules: number;
  actualDistanceKm: number;
};

export function getVehicleReportRows(
  vehicles: Vehicle[],
  schedules: Schedule[],
  filters: Pick<ReportFilters, "fromDate" | "toDate" | "barangay">
): VehicleReportRow[] {
  const usageByVehicle = new Map<
    string,
    { completedSchedules: number; actualDistanceKm: number }
  >();

  schedules.forEach((schedule) => {
    if (
      schedule.archivedAt ||
      schedule.status !== "completed" ||
      schedule.date < filters.fromDate ||
      schedule.date > filters.toDate ||
      !schedule.vehicleId ||
      (filters.barangay !== "all" &&
        !parseScheduleBarangays(schedule.barangay).includes(filters.barangay))
    ) {
      return;
    }

    const usage = usageByVehicle.get(schedule.vehicleId) ?? {
      completedSchedules: 0,
      actualDistanceKm: 0,
    };
    usage.completedSchedules += 1;
    usage.actualDistanceKm += schedule.actualDistanceKm;
    usageByVehicle.set(schedule.vehicleId, usage);
  });

  return vehicles
    .map((vehicle) => {
      const usage = usageByVehicle.get(vehicle.id);
      return {
        vehicle,
        completedSchedules: usage?.completedSchedules ?? 0,
        actualDistanceKm: usage?.actualDistanceKm ?? 0,
      };
    })
    .sort((a, b) => a.vehicle.vehicleCode.localeCompare(b.vehicle.vehicleCode));
}
