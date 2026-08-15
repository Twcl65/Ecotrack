"use client";

import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  MapPin,
  Pencil,
  Plus,
  Route as RouteIcon,
  Search,
  Trash2,
  User,
} from "lucide-react";
import { useMemo, useState } from "react";
import RouteStatusBadge from "./RouteStatusBadge";
import type { Route, RouteStatus } from "@/types/routes";
import {
  ROUTE_STATUS_OPTIONS,
  formatDistance,
  formatEstimatedTime,
  routeCodeColor,
} from "@/types/routes";

type Props = {
  routes: Route[];
  driverOptions: string[];
  barangayOptions: string[];
  onAdd: () => void;
  onView: (route: Route) => void;
  onEdit: (route: Route) => void;
  onDelete: (route: Route) => void;
};

const PAGE_SIZE = 6;

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-8 text-sm outline-none focus:border-eco-primary focus:ring-2 focus:ring-eco-primary/20";

function routeTitle(route: Route): string {
  const num = parseInt(route.routeCode.replace(/\D/g, ""), 10);
  return Number.isNaN(num) ? route.name : `Route ${num}`;
}

export default function RouteTable({
  routes,
  driverOptions,
  barangayOptions,
  onAdd,
  onView,
  onEdit,
  onDelete,
}: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<RouteStatus | "all">("all");
  const [driverFilter, setDriverFilter] = useState("all");
  const [barangayFilter, setBarangayFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return routes.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (driverFilter !== "all" && r.driverName !== driverFilter) return false;
      if (barangayFilter !== "all") {
        const hay = `${r.barangay} ${r.area}`.toLowerCase();
        if (!hay.includes(barangayFilter.toLowerCase())) return false;
      }
      if (!q) return true;
      return (
        r.routeCode.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.area.toLowerCase().includes(q) ||
        r.barangay.toLowerCase().includes(q) ||
        r.driverName.toLowerCase().includes(q) ||
        r.vehicleId.toLowerCase().includes(q)
      );
    });
  }, [routes, search, statusFilter, driverFilter, barangayFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );
  const rangeStart =
    filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, filtered.length);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-3 flex shrink-0 flex-wrap items-end gap-2">
        <div className="relative w-full min-w-[160px] flex-1 sm:max-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search routes..."
            className={`${inputClass} pl-9`}
          />
        </div>

        <FilterSelect
          className="w-full sm:w-[130px]"
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v as RouteStatus | "all");
            setPage(1);
          }}
          options={[
            { value: "all", label: "All Status" },
            ...ROUTE_STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
          ]}
        />

        <FilterSelect
          className="w-full sm:w-[130px]"
          value={driverFilter}
          onChange={(v) => {
            setDriverFilter(v);
            setPage(1);
          }}
          options={[
            { value: "all", label: "All Drivers" },
            ...driverOptions.map((d) => ({ value: d, label: d })),
          ]}
        />

        <FilterSelect
          className="w-full sm:w-[140px]"
          value={barangayFilter}
          onChange={(v) => {
            setBarangayFilter(v);
            setPage(1);
          }}
          options={[
            { value: "all", label: "All Barangays" },
            ...barangayOptions.map((b) => ({ value: b, label: b })),
          ]}
        />

        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="w-full sm:w-[150px] rounded-lg border border-gray-200 bg-white py-2 px-3 text-sm outline-none focus:border-eco-primary focus:ring-2 focus:ring-eco-primary/20"
        />

        <button
          type="button"
          onClick={onAdd}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-eco-primary px-4 py-2 text-sm font-medium text-white hover:bg-eco-dark"
        >
          <Plus className="h-4 w-4" />
          Add New Route
        </button>
      </div>

      <div className="dashboard-card min-h-0 flex-1 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">Route</th>
                <th className="px-4 py-3">Barangay</th>
                <th className="px-4 py-3">Distance</th>
                <th className="px-4 py-3">Est. Time</th>
                <th className="px-4 py-3">Driver</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                    No routes found.
                  </td>
                </tr>
              ) : (
                pageItems.map((route) => (
                  <tr
                    key={route.id}
                    className="border-b border-gray-50 hover:bg-gray-50/60"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold ${routeCodeColor(route.routeCode)}`}
                        >
                          {route.routeCode}
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900">{routeTitle(route)}</p>
                          <p className="truncate text-xs text-gray-500">{route.area}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{route.barangay}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-gray-700">
                        <RouteIcon className="h-3.5 w-3.5 text-gray-400" />
                        {formatDistance(route.distanceKm)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-gray-700">
                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                        {formatEstimatedTime(route.estimatedMinutes)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100">
                          <User className="h-4 w-4 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{route.driverName}</p>
                          <p className="text-xs text-gray-500">{route.vehicleId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <RouteStatusBadge status={route.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <IconButton label="View" onClick={() => onView(route)} color="text-blue-600">
                          <Eye className="h-4 w-4" />
                        </IconButton>
                        <IconButton label="Edit" onClick={() => onEdit(route)} color="text-emerald-600">
                          <Pencil className="h-4 w-4" />
                        </IconButton>
                        <IconButton label="Delete" onClick={() => onDelete(route)} color="text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 px-4 py-3 text-sm text-gray-600">
          <p>
            Showing {rangeStart} to {rangeEnd} of {filtered.length} routes
          </p>
          <div className="flex items-center gap-1">
            <PagerButton
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </PagerButton>
            <span className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-eco-primary px-2 text-xs font-semibold text-white">
              {currentPage}
            </span>
            <PagerButton
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </PagerButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${inputClass} ${className}`}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function IconButton({
  children,
  label,
  onClick,
  color,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  color: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`rounded-lg p-1.5 hover:bg-gray-100 ${color}`}
    >
      {children}
    </button>
  );
}

function PagerButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-lg border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
    >
      {children}
    </button>
  );
}
