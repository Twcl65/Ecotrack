import RoutePageContent from "@/components/dashboard/routes/RoutePageContent";
import {
  getBarangayOptions,
  getDriverOptions,
  getRoutes,
} from "@/lib/routes/data";

export default async function RoutesPage() {
  const [routes, driverOptions, barangayOptions] = await Promise.all([
    getRoutes(),
    getDriverOptions(),
    getBarangayOptions(),
  ]);

  return (
    <RoutePageContent
      initialRoutes={routes}
      driverOptions={driverOptions}
      barangayOptions={barangayOptions}
    />
  );
}
