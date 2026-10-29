import type { Route, RouteStats } from "@/types/routes";

export function computeRouteStats(routes: Route[]): RouteStats {
  const activeRoutesList = routes.filter((r) => !r.archivedAt);
  const activeRoutes = activeRoutesList.filter((r) => r.status === "active").length;
  const totalDistanceKm = activeRoutesList.reduce((sum, r) => sum + r.distanceKm, 0);
  const completedToday = activeRoutesList.filter(
    (r) => r.status === "completed"
  ).length;

  return {
    totalRoutes: activeRoutesList.length,
    activeRoutes,
    totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
    completedToday,
  };
}
