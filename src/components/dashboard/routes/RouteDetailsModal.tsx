"use client";

import dynamic from "next/dynamic";
import {
  Clock,
  MapPin,
  Pencil,
  Play,
  Route as RouteIcon,
  User,
  X,
} from "lucide-react";
import RouteStatusBadge from "./RouteStatusBadge";
import type { Route, RouteStopStatus } from "@/types/routes";
import {
  formatDistance,
  formatEstimatedTime,
  routeCodeColor,
} from "@/types/routes";

const RouteLeafletMap = dynamic(() => import("./RouteLeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[220px] items-center justify-center rounded-lg bg-gray-100 text-sm text-gray-500">
      Loading map...
    </div>
  ),
});

type Props = {
  route: Route | null;
  open: boolean;
  onClose: () => void;
  onEdit: (route: Route) => void;
};

function routeTitle(route: Route): string {
  const num = parseInt(route.routeCode.replace(/\D/g, ""), 10);
  return Number.isNaN(num) ? route.name : `Route ${num} - ${route.area}`;
}

function stopBadge(status: RouteStopStatus): { label: string; className: string } {
  switch (status) {
    case "start":
      return { label: "Start", className: "bg-emerald-100 text-emerald-700" };
    case "end":
      return { label: "End", className: "bg-red-100 text-red-600" };
    case "completed":
      return { label: "Completed", className: "bg-blue-100 text-blue-700" };
    default:
      return { label: "Pending", className: "bg-amber-100 text-amber-700" };
  }
}

export default function RouteDetailsModal({ route, open, onClose, onEdit }: Props) {
  if (!open || !route) return null;

  const headStops = route.stops.length > 5 ? route.stops.slice(0, 3) : route.stops;
  const tailStop = route.stops.length > 5 ? route.stops[route.stops.length - 1] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative z-10 max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Route Details</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-md px-2 py-0.5 text-xs font-semibold ${routeCodeColor(route.routeCode)}`}
              >
                {route.routeCode}
              </span>
              <span className="text-sm font-semibold text-gray-800">{routeTitle(route)}</span>
              <RouteStatusBadge status={route.status} />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric icon={RouteIcon} label={formatDistance(route.distanceKm)} />
            <Metric icon={Clock} label={formatEstimatedTime(route.estimatedMinutes)} />
            <Metric icon={MapPin} label={`${route.stops.length}`} sub="Stops" />
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                <User className="h-4 w-4 text-gray-500" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">{route.driverName}</p>
                <p className="text-xs text-gray-500">{route.vehicleId}</p>
              </div>
            </div>
          </div>

          <RouteLeafletMap stops={route.stops} className="h-[220px]" />

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">
                Route Stops ({route.stops.length})
              </h3>
              <button type="button" className="text-xs font-medium text-eco-primary hover:underline">
                View Full Route
              </button>
            </div>
            <ul className="space-y-2">
              {headStops.map((stop) => (
                <StopRow key={stop.id} stop={stop} />
              ))}
              {tailStop && (
                <>
                  <li className="px-2 text-center text-gray-400">...</li>
                  <StopRow stop={tailStop} />
                </>
              )}
            </ul>
          </div>
        </div>

        <div className="flex gap-3 border-t border-gray-100 px-5 py-4">
          <button
            type="button"
            onClick={() => {
              onClose();
              onEdit(route);
            }}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-eco-primary px-4 py-2.5 text-sm font-medium text-eco-primary hover:bg-eco-light"
          >
            <Pencil className="h-4 w-4" />
            Edit Route
          </button>
          <button
            type="button"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-eco-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-eco-dark"
          >
            <Play className="h-4 w-4" />
            Start Route
          </button>
        </div>
      </div>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  sub?: string;
}) {
  return (
    <div className="text-center">
      <Icon className="mx-auto h-4 w-4 text-gray-400" />
      <p className="mt-1 text-sm font-semibold text-gray-900">{label}</p>
      {sub && <p className="text-[10px] text-gray-500">{sub}</p>}
    </div>
  );
}

function StopRow({ stop }: { stop: Route["stops"][number] }) {
  const badge = stopBadge(stop.status);
  return (
    <li className="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-2">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
        {stop.stopOrder}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900">{stop.name}</p>
        <p className="truncate text-xs text-gray-500">{stop.description}</p>
      </div>
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.className}`}
      >
        {badge.label}
      </span>
    </li>
  );
}
