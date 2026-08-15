import type { Route, RouteStats } from "@/types/routes";

export function computeRouteStats(routes: Route[]): RouteStats {
  const activeRoutes = routes.filter((r) => r.status === "active").length;
  const totalDistanceKm = routes.reduce((sum, r) => sum + r.distanceKm, 0);
  const completedToday = routes.filter((r) => r.status === "completed").length;

  return {
    totalRoutes: routes.length,
    activeRoutes,
    totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
    completedToday,
  };
}
