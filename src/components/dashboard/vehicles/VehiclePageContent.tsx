"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  Plus,
  Truck,
  Wrench,
} from "lucide-react";
import { useMemo, useState } from "react";
import { saveVehicle } from "@/app/dashboard/vehicles/actions";
import VehicleFormModal from "./VehicleFormModal";
import VehicleMaintenanceRequestsPanel from "./VehicleMaintenanceRequestsPanel";
import type {
  Vehicle,
  VehicleFormValues,
  VehicleMaintenanceRequest,
} from "@/types/vehicles";

type Props = {
  initialVehicles: Vehicle[];
  driverOptions: string[];
  initialMaintenanceRequests: VehicleMaintenanceRequest[];
};

type MaintenanceStatus = "up-to-date" | "due-soon" | "overdue" | "not-scheduled";

function maintenanceStatus(vehicle: Vehicle, today: string): MaintenanceStatus {
  const dateIsDue = Boolean(
    vehicle.nextMaintenanceDate && vehicle.nextMaintenanceDate < today
  );
  const kilometersRemaining =
    vehicle.nextMaintenanceOdometerKm === null
      ? null
      : vehicle.nextMaintenanceOdometerKm - vehicle.currentOdometerKm;
  if (dateIsDue || (kilometersRemaining !== null && kilometersRemaining <= 0)) {
    return "overdue";
  }

  const dateIsSoon = vehicle.nextMaintenanceDate
    ? Math.ceil(
        (new Date(`${vehicle.nextMaintenanceDate}T00:00:00Z`).getTime() -
          new Date(`${today}T00:00:00Z`).getTime()) /
          86_400_000
      ) <= 30
    : false;
  if (
    dateIsSoon ||
    (kilometersRemaining !== null && kilometersRemaining <= 500)
  ) {
    return "due-soon";
  }

  return vehicle.nextMaintenanceDate || kilometersRemaining !== null
    ? "up-to-date"
    : "not-scheduled";
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function statusLabel(status: MaintenanceStatus) {
  switch (status) {
    case "up-to-date":
      return "Up to Date";
    case "due-soon":
      return "Due Soon";
    case "overdue":
      return "Overdue";
    case "not-scheduled":
      return "Not Scheduled";
  }
}

export default function VehiclePageContent({
  initialVehicles,
  driverOptions,
  initialMaintenanceRequests,
}: Props) {
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [pageError, setPageError] = useState("");
  const today = new Date().toISOString().slice(0, 10);

  const counts = useMemo(() => {
    return vehicles.reduce(
      (result, vehicle) => {
        result.total += 1;
        if (vehicle.status === "active") result.operational += 1;
        const status = maintenanceStatus(vehicle, today);
        if (status === "due-soon") result.dueSoon += 1;
        if (status === "overdue") result.overdue += 1;
        return result;
      },
      { total: 0, operational: 0, dueSoon: 0, overdue: 0 }
    );
  }, [today, vehicles]);

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
    setPageError("");
  }

  async function handleSave(values: VehicleFormValues) {
    const result = await saveVehicle(editing?.id ?? null, values);
    if (!result.success) {
      setPageError(result.error);
      return result;
    }

    setVehicles((current) => {
      const exists = current.some((vehicle) => vehicle.id === result.vehicle.id);
      return exists
        ? current.map((vehicle) =>
            vehicle.id === result.vehicle.id ? result.vehicle : vehicle
          )
        : [result.vehicle, ...current];
    });
    setFormOpen(false);
    setPageError("");
    return result;
  }

  return (
    <div className="vehicles-page flex h-full flex-col gap-3 overflow-y-auto">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-gray-900 sm:text-base">
            Manage Vehicles
          </h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Track fleet assignments, odometer readings, and maintenance.
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-1.5 rounded-lg bg-eco-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-eco-dark"
        >
          <Plus className="h-4 w-4" />
          Add Vehicle
        </button>
      </div>

      <div className="vehicles-kpi-row shrink-0">
        <KpiCard label="Total Vehicles" value={counts.total} icon={Truck} color="green" />
        <KpiCard label="Operational" value={counts.operational} icon={CheckCircle2} color="blue" />
        <KpiCard label="Due for Maintenance" value={counts.dueSoon} icon={Wrench} color="amber" />
        <KpiCard label="Overdue" value={counts.overdue} icon={AlertTriangle} color="red" />
      </div>

      {pageError && (
        <p role="alert" className="shrink-0 text-sm text-red-600">
          {pageError}
        </p>
      )}

      <section className="dashboard-card flex min-h-[300px] flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Vehicle Inventory</h3>
            <p className="text-xs text-gray-500">
              Showing {vehicles.length} vehicles
            </p>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
          {vehicles.length === 0 ? (
            <p className="px-4 py-12 text-center text-sm text-gray-500">
              No vehicles have been added yet.
            </p>
          ) : (
            <>
              <div className="hidden xl:block">
                <table className="w-full table-fixed text-left text-xs">
                  <colgroup>
                    <col style={{ width: "14%" }} />
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "8%" }} />
                    <col style={{ width: "9%" }} />
                    <col style={{ width: "9%" }} />
                    <col style={{ width: "9%" }} />
                    <col style={{ width: "9%" }} />
                    <col style={{ width: "14%" }} />
                    <col style={{ width: "8%" }} />
                  </colgroup>
                  <thead className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50">
                    <tr>
                      {[
                        "Vehicle",
                        "Type & model",
                        "Assigned driver",
                        "Odometer Start (km)",
                        "Odometer Current (km)",
                        "Actual Distance (km)",
                        "Last service",
                        "Next service",
                        "Maintenance",
                        "Action",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="break-words px-2 py-3 font-semibold text-gray-700"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.map((vehicle) => {
                      const status = maintenanceStatus(vehicle, today);
                      return (
                        <tr
                          key={vehicle.id}
                          className="border-b border-gray-100 align-top last:border-0 hover:bg-gray-50/60"
                        >
                          <td className="break-words px-2 py-3">
                            <span className="block font-semibold text-gray-900">
                              {vehicle.plateNumber}
                            </span>
                            <span className="text-[10px] text-gray-500">
                              {vehicle.vehicleCode}
                            </span>
                          </td>
                          <td className="break-words px-2 py-3 text-gray-700">
                            <span className="block">{vehicle.vehicleType}</span>
                            <span className="text-gray-500">{vehicle.model}</span>
                          </td>
                          <td className="break-words px-2 py-3 text-gray-700">
                            {vehicle.assignedDriver || "—"}
                          </td>
                          <td className="px-2 py-3 tabular-nums text-gray-700">
                            {vehicle.startingOdometerKm.toLocaleString()} km
                          </td>
                          <td className="px-2 py-3 tabular-nums text-gray-700">
                            {vehicle.currentOdometerKm.toLocaleString()} km
                          </td>
                          <td className="px-2 py-3 tabular-nums text-gray-700">
                            {(vehicle.currentOdometerKm -
                              vehicle.startingOdometerKm).toLocaleString()} km
                          </td>
                          <td className="break-words px-2 py-3 text-gray-700">
                            <span className="block">
                              {formatDate(vehicle.lastMaintenanceDate)}
                            </span>
                            <span className="text-[10px] text-gray-500">
                              {vehicle.lastMaintenanceOdometerKm?.toLocaleString() ??
                                "—"}{" "}
                              km
                            </span>
                          </td>
                          <td className="break-words px-2 py-3 text-gray-700">
                            <span className="block">
                              {formatDate(vehicle.nextMaintenanceDate)}
                            </span>
                            <span className="text-[10px] text-gray-500">
                              {vehicle.nextMaintenanceOdometerKm?.toLocaleString() ??
                                "—"}{" "}
                              km
                            </span>
                          </td>
                          <td className="break-words px-2 py-3">
                            <span className="mb-1 block text-gray-700">
                              {vehicle.maintenanceType || "—"}
                            </span>
                            <StatusBadge
                              label={
                                vehicle.status === "inactive"
                                  ? "Inactive"
                                  : statusLabel(status)
                              }
                              variant={
                                vehicle.status === "inactive" ? "gray" : status
                              }
                            />
                          </td>
                          <td className="px-2 py-3">
                            <button
                              type="button"
                              onClick={() => {
                                setEditing(vehicle);
                                setFormOpen(true);
                                setPageError("");
                              }}
                              className="inline-flex items-center gap-1 rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-eco-primary"
                              aria-label={`Manage ${vehicle.plateNumber}`}
                            >
                              <Eye className="h-4 w-4" />
                              <span>Edit</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 p-3 xl:hidden">
                {vehicles.map((vehicle) => (
                  <VehicleInventoryCard
                    key={vehicle.id}
                    vehicle={vehicle}
                    today={today}
                    onEdit={() => {
                      setEditing(vehicle);
                      setFormOpen(true);
                      setPageError("");
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <div className="shrink-0 space-y-3">
        <VehicleMaintenanceRequestsPanel
          initialRequests={initialMaintenanceRequests}
          onVehicleUpdated={(updatedVehicle) =>
            setVehicles((current) =>
              current.map((vehicle) =>
                vehicle.id === updatedVehicle.id ? updatedVehicle : vehicle
              )
            )
          }
        />
        <section className="dashboard-card p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Wrench className="h-4 w-4 text-eco-primary" />
            Vehicle Maintenance Summary
          </h3>
          <SummaryRow label="Up to Date" count={vehicles.filter((v) => maintenanceStatus(v, today) === "up-to-date").length} tone="green" />
          <SummaryRow label="Due Soon" count={counts.dueSoon} tone="amber" />
          <SummaryRow label="Overdue" count={counts.overdue} tone="red" />
          <SummaryRow label="Not Scheduled" count={vehicles.filter((v) => maintenanceStatus(v, today) === "not-scheduled").length} tone="gray" />
        </section>
        <section className="dashboard-card p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-eco-primary text-xs font-bold text-white">i</span>
            Notes
          </h3>
          <ul className="list-disc space-y-1.5 pl-5 text-xs leading-relaxed text-gray-600">
            <li>Actual distance is the current odometer reading minus the starting reading.</li>
            <li>Collection distance is measured from accepted driver GPS updates, not the planned route length.</li>
            <li>Maintenance is due soon within 30 days or 500 km of the next service target.</li>
            <li>Vehicles without a registered driver-to-vehicle assignment will not receive collection odometer updates.</li>
          </ul>
        </section>
      </div>

      {formOpen && (
        <VehicleFormModal
          vehicle={editing}
          driverOptions={driverOptions}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function VehicleInventoryCard({
  vehicle,
  today,
  onEdit,
}: {
  vehicle: Vehicle;
  today: string;
  onEdit: () => void;
}) {
  const status = maintenanceStatus(vehicle, today);

  return (
    <article className="rounded-lg border border-gray-200 bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="break-words text-sm font-semibold text-gray-900">
            {vehicle.plateNumber}
          </h4>
          <p className="text-xs text-gray-500">{vehicle.vehicleCode}</p>
          <p className="mt-1 break-words text-xs text-gray-700">
            {vehicle.vehicleType} · {vehicle.model}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <StatusBadge
            label={
              vehicle.status === "inactive" ? "Inactive" : statusLabel(status)
            }
            variant={vehicle.status === "inactive" ? "gray" : status}
          />
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1 rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-eco-primary"
            aria-label={`Manage ${vehicle.plateNumber}`}
          >
            <Eye className="h-4 w-4" />
            <span className="text-xs">Edit</span>
          </button>
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-gray-100 pt-3 text-xs">
        <VehicleDetail label="Assigned driver">
          {vehicle.assignedDriver || "—"}
        </VehicleDetail>
        <VehicleDetail label="Current odometer">
          {vehicle.currentOdometerKm.toLocaleString()} km
        </VehicleDetail>
        <VehicleDetail label="Starting odometer">
          {vehicle.startingOdometerKm.toLocaleString()} km
        </VehicleDetail>
        <VehicleDetail label="Actual distance">
          {(vehicle.currentOdometerKm -
            vehicle.startingOdometerKm).toLocaleString()}{" "}
          km
        </VehicleDetail>
        <VehicleDetail label="Last service">
          {formatDate(vehicle.lastMaintenanceDate)}
          {vehicle.lastMaintenanceOdometerKm !== null
            ? ` · ${vehicle.lastMaintenanceOdometerKm.toLocaleString()} km`
            : ""}
        </VehicleDetail>
        <VehicleDetail label="Next service">
          {formatDate(vehicle.nextMaintenanceDate)}
          {vehicle.nextMaintenanceOdometerKm !== null
            ? ` · ${vehicle.nextMaintenanceOdometerKm.toLocaleString()} km`
            : ""}
        </VehicleDetail>
        <VehicleDetail label="Maintenance type">
          {vehicle.maintenanceType || "—"}
        </VehicleDetail>
      </dl>
    </article>
  );
}

function VehicleDetail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
        {label}
      </dt>
      <dd className="break-words text-gray-800">{children}</dd>
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: typeof Truck;
  color: "green" | "blue" | "amber" | "red";
}) {
  const colorClass = {
    green: "bg-emerald-100 text-emerald-700",
    blue: "bg-blue-100 text-blue-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-700",
  }[color];

  return (
    <div className="dashboard-card flex items-center gap-3 px-3 py-2.5">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${colorClass}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs font-medium text-gray-600">{label}</p>
        <p className="text-xl font-bold leading-tight text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({
  label,
  variant,
}: {
  label: string;
  variant: MaintenanceStatus | "gray";
}) {
  const styles = {
    "up-to-date": "bg-emerald-100 text-emerald-800",
    "due-soon": "bg-amber-100 text-amber-800",
    overdue: "bg-red-100 text-red-800",
    "not-scheduled": "bg-gray-100 text-gray-700",
    gray: "bg-gray-100 text-gray-700",
  }[variant];

  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-semibold ${styles}`}>
      {label}
    </span>
  );
}

function SummaryRow({
  label,
  count,
  tone,
}: {
  label: string;
  count: number;
  tone: "green" | "amber" | "red" | "gray";
}) {
  const tones = {
    green: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-700",
    gray: "bg-gray-100 text-gray-600",
  }[tone];
  const Icon = tone === "green" ? CheckCircle2 : tone === "red" ? AlertTriangle : Wrench;

  return (
    <div className="flex items-center gap-2 py-1 text-xs">
      <Icon className={`h-4 w-4 rounded-full ${tones}`} />
      <span className="text-gray-700">{label}</span>
      <span className="ml-auto font-semibold tabular-nums text-gray-800">{count}</span>
    </div>
  );
}

