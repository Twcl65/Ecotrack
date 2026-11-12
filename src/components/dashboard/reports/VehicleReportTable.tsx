"use client";

import { ClipboardList, LoaderCircle, Wrench } from "lucide-react";
import { useMemo, useState } from "react";
import {
  saveVehicleMaintenanceData,
  type VehicleMaintenanceData,
} from "@/app/dashboard/report/vehicle-actions";
import type { ReportFilters } from "@/types/reports";
import type { Route } from "@/types/routes";
import type { Schedule } from "@/types/schedules";
import { getVehicleDriverReportRows } from "@/lib/reports/vehicle-report";

type Props = {
  routes: Route[];
  schedules: Schedule[];
  initialMaintenance: VehicleMaintenanceData[];
  onMaintenanceChange: (maintenance: VehicleMaintenanceData[]) => void;
  filters: ReportFilters;
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} hr`;
  return `${hours} hr ${minutes} min`;
}

export default function VehicleReportTable({
  routes,
  schedules,
  initialMaintenance,
  onMaintenanceChange,
  filters,
}: Props) {
  const [maintenance, setMaintenance] = useState(initialMaintenance);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [editingRoutes, setEditingRoutes] = useState<Route[]>([]);
  const [scheduleText, setScheduleText] = useState("");
  const [nextDate, setNextDate] = useState("");
  const [serviceDate, setServiceDate] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const rows = useMemo(() => {
    return getVehicleDriverReportRows(routes, schedules, maintenance, filters);
  }, [routes, schedules, filters, maintenance]);

  function selectMaintenanceRoute(route: Route) {
    const existing = maintenance.find((item) => item.routeId === route.id);
    setEditingRoute(route);
    setScheduleText(existing?.maintenanceSchedule ?? "");
    setNextDate(existing?.nextMaintenanceDate ?? "");
    setServiceDate("");
    setServiceDescription("");
    setErrorMessage("");
  }

  function openMaintenance(routesForDriver: Route[]) {
    setEditingRoutes(routesForDriver);
    if (routesForDriver[0]) selectMaintenanceRoute(routesForDriver[0]);
  }

  async function saveMaintenance() {
    if (!editingRoute) return;
    setSaving(true);
    setErrorMessage("");
    try {
      const saved = await saveVehicleMaintenanceData({
        routeId: editingRoute.id,
        maintenanceSchedule: scheduleText,
        nextMaintenanceDate: nextDate,
        serviceDate,
        serviceDescription,
      });
      const updated = [
        ...maintenance.filter((item) => item.routeId !== saved.routeId),
        saved,
      ];
      setMaintenance(updated);
      onMaintenanceChange(updated);
      setEditingRoute(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not save vehicle maintenance."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <section className="dashboard-card overflow-hidden">
        <div className="border-b border-gray-100 px-4 py-3">
          <h2 className="font-semibold text-gray-900">Vehicle Report</h2>
          <p className="text-xs text-gray-500">
            Estimated kilometers and travel time use the route distance and duration multiplied by completed schedules in the selected date range. Add maintenance records per vehicle.
          </p>
        </div>
        <div className="overflow-auto">
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50/95">
              <tr>
                {[
                  "Driver",
                  "Completed routes",
                  "Estimated kilometers",
                  "Total travel time",
                  "Maintenance schedule",
                  "Last maintenance",
                  "Next maintenance",
                  "History",
                  "Action",
                ].map((heading) => (
                  <th key={heading} className="px-3 py-3 text-xs font-bold uppercase tracking-wide text-gray-700">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.driver} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60">
                  <td className="px-3 py-3 text-gray-700">{row.driver}</td>
                  <td className="px-3 py-3 tabular-nums text-gray-800">{row.completedRuns}</td>
                  <td className="px-3 py-3 tabular-nums text-gray-800">
                    {row.estimatedKilometers.toFixed(1)} km
                  </td>
                  <td className="px-3 py-3 tabular-nums text-gray-800">
                    {formatDuration(row.totalTravelMinutes)}
                  </td>
                  <td className="px-3 py-3 text-gray-700">
                    {row.maintenanceSchedules.length
                      ? row.maintenanceSchedules.join("; ")
                      : "Not set"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-gray-700">{formatDate(row.lastMaintenanceDate)}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-gray-700">
                    {formatDate(row.nextMaintenanceDate)}
                  </td>
                  <td className="max-w-[240px] px-3 py-3 text-xs text-gray-600">
                    {row.history.length ? (
                      <ul className="space-y-1">
                        {row.history.map((item) => (
                          <li key={item.id}>
                            <span className="font-medium">{formatDate(item.serviceDate)}:</span> {item.description}
                          </li>
                        ))}
                      </ul>
                    ) : "No history"}
                  </td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      onClick={() => openMaintenance(row.routes)}
                      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-eco-primary px-2.5 py-1.5 text-xs font-semibold text-eco-primary hover:bg-eco-light"
                    >
                      <Wrench className="h-3.5 w-3.5" />
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-sm text-gray-500">
                    No drivers match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {editingRoute && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="vehicle-maintenance-title"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-5 shadow-xl"
          >
            <div className="mb-5">
              <h2 id="vehicle-maintenance-title" className="text-lg font-bold text-gray-900">
                Vehicle maintenance
              </h2>
              {editingRoutes.length > 1 ? (
                <Field label="Vehicle to manage">
                  <select
                    value={editingRoute.id}
                    onChange={(event) => {
                      const route = editingRoutes.find((item) => item.id === event.target.value);
                      if (route) selectMaintenanceRoute(route);
                    }}
                    className={inputClass}
                  >
                    {editingRoutes.map((route) => (
                      <option key={route.id} value={route.id}>
                        {route.vehicleId || route.routeCode} · {route.name}
                      </option>
                    ))}
                  </select>
                </Field>
              ) : (
                <p className="mt-1 text-sm text-gray-500">
                  {editingRoute.vehicleId || editingRoute.routeCode} · {editingRoute.name}
                </p>
              )}
            </div>
            <div className="space-y-4">
              <Field label="Maintenance schedule">
                <input
                  value={scheduleText}
                  onChange={(event) => setScheduleText(event.target.value)}
                  placeholder="e.g. Oil change every 3 months"
                  className={inputClass}
                />
              </Field>
              <Field label="Next maintenance date">
                <input
                  type="date"
                  value={nextDate}
                  onChange={(event) => setNextDate(event.target.value)}
                  aria-describedby="next-maintenance-hint"
                  className={inputClass}
                />
                <span id="next-maintenance-hint" className="mt-1 block text-xs text-gray-500">
                  Leave blank if no next service is scheduled.
                </span>
              </Field>
              <div className="border-t border-gray-100 pt-4">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <ClipboardList className="h-4 w-4 text-eco-primary" />
                  Add completed maintenance to history
                </h3>
                <div className="space-y-3">
                  <Field label="Service date">
                    <input
                      type="date"
                      value={serviceDate}
                      onChange={(event) => setServiceDate(event.target.value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Service details">
                    <textarea
                      value={serviceDescription}
                      onChange={(event) => setServiceDescription(event.target.value)}
                      rows={3}
                      placeholder="Describe the maintenance performed"
                      className={inputClass}
                    />
                  </Field>
                </div>
              </div>
            </div>
            {errorMessage && (
              <p role="alert" className="mt-4 text-sm text-red-600">{errorMessage}</p>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingRoute(null)}
                disabled={saving}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void saveMaintenance()}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-eco-primary px-4 py-2 text-sm font-semibold text-white hover:bg-eco-dark disabled:opacity-60"
              >
                {saving && <LoaderCircle className="h-4 w-4 animate-spin" />}
                Save maintenance
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-eco-primary focus:ring-2 focus:ring-eco-primary/20";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-gray-700">{label}</span>
      {children}
    </label>
  );
}
