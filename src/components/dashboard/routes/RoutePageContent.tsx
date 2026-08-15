"use client";

import { useCallback, useMemo, useState } from "react";
import DeleteRouteModal from "./DeleteRouteModal";
import RouteDetailsModal from "./RouteDetailsModal";
import RouteFormModal from "./RouteFormModal";
import RouteKpiCards from "./RouteKpiCards";
import RouteTable from "./RouteTable";
import { computeRouteStats } from "@/lib/routes/stats";
import type { Route } from "@/types/routes";

type Props = {
  initialRoutes: Route[];
  driverOptions: string[];
  barangayOptions: string[];
};

export default function RoutePageContent({
  initialRoutes,
  driverOptions,
  barangayOptions,
}: Props) {
  const [routes, setRoutes] = useState(initialRoutes);
  const [viewing, setViewing] = useState<Route | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editing, setEditing] = useState<Route | undefined>();
  const [deleting, setDeleting] = useState<Route | null>(null);

  const stats = useMemo(() => computeRouteStats(routes), [routes]);

  const openAdd = useCallback(() => {
    setFormMode("add");
    setEditing(undefined);
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((route: Route) => {
    setFormMode("edit");
    setEditing(route);
    setFormOpen(true);
  }, []);

  const handleSave = useCallback((route: Route) => {
    setRoutes((prev) => {
      const idx = prev.findIndex((r) => r.id === route.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = route;
        return next.sort((a, b) => a.routeCode.localeCompare(b.routeCode));
      }
      return [...prev, route].sort((a, b) => a.routeCode.localeCompare(b.routeCode));
    });
    setViewing((v) => (v?.id === route.id ? route : v));
  }, []);

  const handleDelete = useCallback((id: string) => {
    setRoutes((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return (
    <>
      <div className="routes-page flex flex-col gap-3">
        <RouteKpiCards stats={stats} />
        <RouteTable
          routes={routes}
          driverOptions={driverOptions}
          barangayOptions={barangayOptions}
          onAdd={openAdd}
          onView={setViewing}
          onEdit={openEdit}
          onDelete={setDeleting}
        />
      </div>

      <RouteDetailsModal
        route={viewing}
        open={!!viewing}
        onClose={() => setViewing(null)}
        onEdit={openEdit}
      />

      <RouteFormModal
        mode={formMode}
        route={editing}
        driverOptions={driverOptions}
        barangayOptions={barangayOptions}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={handleSave}
      />

      <DeleteRouteModal
        route={deleting}
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onSuccess={handleDelete}
      />
    </>
  );
}
