import { getDriverOptions } from "@/lib/routes/data";
import {
  getVehicleMaintenanceRequests,
  getVehicles,
} from "@/lib/vehicles/data";
import VehiclePageContent from "@/components/dashboard/vehicles/VehiclePageContent";

export default async function VehiclesPage() {
  const [vehicles, driverOptions, maintenanceRequests] = await Promise.all([
    getVehicles(),
    getDriverOptions(),
    getVehicleMaintenanceRequests(),
  ]);

  return (
    <VehiclePageContent
      key={maintenanceRequests
        .map((request) => `${request.id}:${request.status}:${request.updatedAt}`)
        .join("|")}
      initialVehicles={vehicles}
      driverOptions={driverOptions}
      initialMaintenanceRequests={maintenanceRequests}
    />
  );
}
