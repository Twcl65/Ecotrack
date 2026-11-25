"use client";

import { getVehicleReportRows } from "@/lib/reports/vehicle-report";
import type { ReportFilters } from "@/types/reports";
import type { Schedule } from "@/types/schedules";
import type { Vehicle } from "@/types/vehicles";

type Props = {
  vehicles: Vehicle[];
  schedules: Schedule[];
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

function formatKm(value: number | null) {
  return value === null ? "—" : `${value.toLocaleString()} km`;
}

export default function VehicleReportTable({
  vehicles,
  schedules,
  filters,
}: Props) {
  const rows = getVehicleReportRows(vehicles, schedules, filters);

  return (
    <section className="dashboard-card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
        <div>
          <h2 className="font-semibold text-gray-900">Vehicle Report</h2>
          <p className="text-xs text-gray-500">
            Managed vehicle details and odometer readings, with GPS distance
            from completed collections in the selected period.
          </p>
        </div>
        <a
          href="/dashboard/vehicles"
          className="shrink-0 rounded-lg border border-eco-primary px-3 py-2 text-xs font-semibold text-eco-primary hover:bg-eco-light"
        >
          Manage Vehicles
        </a>
      </div>

      <div className="hidden xl:block">
        <table className="w-full table-fixed text-left text-xs">
          <colgroup>
            <col style={{ width: "15%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "7%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "15%" }} />
          </colgroup>
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              {[
                "Vehicle",
                "Type & model",
                "Assigned driver",
                "Completed",
                "Odometer Start (km)",
                "Odometer Current (km)",
                "Actual Distance (km)",
                "Last service",
                "Next service",
                "Maintenance",
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
            {rows.map(({ vehicle, completedSchedules, actualDistanceKm }) => (
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
                <td className="px-2 py-3 tabular-nums text-gray-800">
                  {completedSchedules}
                </td>
                <td className="px-2 py-3 tabular-nums text-gray-800">
                  {formatKm(vehicle.startingOdometerKm)}
                </td>
                <td className="px-2 py-3 tabular-nums text-gray-700">
                  {formatKm(vehicle.currentOdometerKm)}
                </td>
                <td className="px-2 py-3 tabular-nums text-gray-800">
                  {actualDistanceKm.toLocaleString(undefined, {
                    maximumFractionDigits: 1,
                  })}{" "}
                  km
                </td>
                <td className="break-words px-2 py-3 text-gray-700">
                  <span className="block">
                    {formatDate(vehicle.lastMaintenanceDate)}
                  </span>
                  <span className="text-[10px] text-gray-500">
                    {formatKm(vehicle.lastMaintenanceOdometerKm)}
                  </span>
                </td>
                <td className="break-words px-2 py-3 text-gray-700">
                  <span className="block">
                    {formatDate(vehicle.nextMaintenanceDate)}
                  </span>
                  <span className="text-[10px] text-gray-500">
                    {formatKm(vehicle.nextMaintenanceOdometerKm)}
                  </span>
                </td>
                <td className="break-words px-2 py-3">
                  <span className="block text-gray-700">
                    {vehicle.maintenanceType || "Not set"}
                  </span>
                  <StatusBadge status={vehicle.status} />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="px-4 py-10 text-center text-sm text-gray-500"
                >
                  No vehicles have been added to Manage Vehicles yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 p-3 xl:hidden">
        {rows.map(({ vehicle, completedSchedules, actualDistanceKm }) => (
          <article
            key={vehicle.id}
            className="rounded-lg border border-gray-200 p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="break-words text-sm font-semibold text-gray-900">
                  {vehicle.plateNumber}
                </h3>
                <p className="text-xs text-gray-500">
                  {vehicle.vehicleCode} · {vehicle.vehicleType}
                </p>
                <p className="break-words text-xs text-gray-600">
                  {vehicle.model}
                </p>
              </div>
              <StatusBadge status={vehicle.status} />
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-gray-100 pt-3 text-xs">
              <ReportValue label="Assigned driver">
                {vehicle.assignedDriver || "—"}
              </ReportValue>
              <ReportValue label="Completed">
                {completedSchedules}
              </ReportValue>
              <ReportValue label="Actual distance (selected period)">
                {actualDistanceKm.toLocaleString(undefined, {
                  maximumFractionDigits: 1,
                })}{" "}
                km
              </ReportValue>
              <ReportValue label="Current odometer">
                {formatKm(vehicle.currentOdometerKm)}
              </ReportValue>
              <ReportValue label="Starting odometer">
                {formatKm(vehicle.startingOdometerKm)}
              </ReportValue>
              <ReportValue label="Last service">
                {formatDate(vehicle.lastMaintenanceDate)}
                {vehicle.lastMaintenanceOdometerKm !== null
                  ? ` · ${formatKm(vehicle.lastMaintenanceOdometerKm)}`
                  : ""}
              </ReportValue>
              <ReportValue label="Next service">
                {formatDate(vehicle.nextMaintenanceDate)}
                {vehicle.nextMaintenanceOdometerKm !== null
                  ? ` · ${formatKm(vehicle.nextMaintenanceOdometerKm)}`
                  : ""}
              </ReportValue>
              <ReportValue label="Maintenance type">
                {vehicle.maintenanceType || "Not set"}
              </ReportValue>
            </dl>
          </article>
        ))}
        {rows.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-500">
            No vehicles have been added to Manage Vehicles yet.
          </p>
        )}
      </div>
    </section>
  );
}

function StatusBadge({ status }: { status: Vehicle["status"] }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-semibold ${
        status === "active"
          ? "bg-emerald-100 text-emerald-800"
          : "bg-gray-100 text-gray-700"
      }`}
    >
      {status === "active" ? "Active" : "Inactive"}
    </span>
  );
}

function ReportValue({
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
