import RoutePageContent from "@/components/dashboard/routes/RoutePageContent";
import {
  getBarangayOptions,
  getDriverOptions,
  getRoutes,
} from "@/lib/routes/data";
import {
  getActiveVehicleOptions,
  getVehicleDisplayOptions,
} from "@/lib/vehicles/data";

export default async function RoutesPage() {
  const [
    routes,
    driverOptions,
    barangayOptions,
    vehicleOptions,
    vehicleDisplayOptions,
  ] = await Promise.all([
    getRoutes(true),
    getDriverOptions(),
    getBarangayOptions(),
    getActiveVehicleOptions(),
    getVehicleDisplayOptions(),
  ]);

  return (
    <RoutePageContent
      initialRoutes={routes}
      driverOptions={driverOptions}
      barangayOptions={barangayOptions}
      vehicleOptions={vehicleOptions}
      vehicleDisplayOptions={vehicleDisplayOptions}
    />
  );
}
