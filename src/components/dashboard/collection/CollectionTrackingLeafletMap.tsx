"use client";

import L from "leaflet";
import { Fragment, useEffect } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import type { CollectionRouteOverlay } from "@/types/collection-monitoring";
import { SCHEDULE_STATUS_CONFIG } from "@/types/schedules";
import type { ScheduleStatus } from "@/types/schedules";
import type { RouteStopStatus } from "@/types/routes";
import "leaflet/dist/leaflet.css";

const JASAAN_CENTER: [number, number] = [8.652, 124.755];

type Props = {
  overlays: CollectionRouteOverlay[];
};

function routeColor(status: ScheduleStatus): string {
  return SCHEDULE_STATUS_CONFIG[status]?.dotColor ?? "#9ca3af";
}

function stopMarkerColor(status: RouteStopStatus): string {
  if (status === "start") return "#056636";
  if (status === "end") return "#dc2626";
  if (status === "completed") return "#2563eb";
  return "#059669";
}

function truckIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:28px;height:28px;border-radius:50%;
      background:#056636;color:#fff;font-size:14px;
      display:flex;align-items:center;justify-content:center;
      border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3);
    ">&#128666;</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function activeStopIndex(stops: CollectionRouteOverlay["stops"]): number {
  const firstOpen = stops.findIndex(
    (stop) => stop.status !== "completed" && stop.status !== "end"
  );
  return firstOpen >= 0 ? firstOpen : Math.max(stops.length - 1, 0);
}
function numberedIcon(order: number, status: RouteStopStatus) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:24px;height:24px;border-radius:50%;
      background:${stopMarkerColor(status)};color:#fff;font-size:10px;font-weight:700;
      display:flex;align-items:center;justify-content:center;
      border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.25);
    ">${order}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function FitAllBounds({ overlays }: { overlays: CollectionRouteOverlay[] }) {
  const map = useMap();

  useEffect(() => {
    const points = overlays.flatMap((overlay) =>
      overlay.stops.map((stop) => [stop.latitude, stop.longitude] as [number, number])
    );
    if (points.length === 0) return;
    map.fitBounds(L.latLngBounds(points), { padding: [28, 28], maxZoom: 15 });
  }, [map, overlays]);

  return null;
}

export default function CollectionTrackingLeafletMap({ overlays }: Props) {
  if (overlays.length === 0) {
    return (
      <div className="flex h-full min-h-[240px] items-center justify-center bg-gray-50 text-sm text-gray-500">
        No scheduled routes to display for the selected filters.
      </div>
    );
  }

  const firstStop = overlays[0]?.stops[0];
  const center: [number, number] = firstStop
    ? [firstStop.latitude, firstStop.longitude]
    : JASAAN_CENTER;

  return (
    <MapContainer
      center={center}
      zoom={14}
      scrollWheelZoom
      className="h-full w-full"
      style={{ minHeight: 240 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {overlays.map((overlay) => {
        const path: [number, number][] = overlay.stops.map((stop) => [
          stop.latitude,
          stop.longitude,
        ]);
        const color = routeColor(overlay.status);
        const isOngoing = overlay.status === "ongoing";
        const isPending = overlay.status === "pending";
        const truckStopIndex = isOngoing ? activeStopIndex(overlay.stops) : -1;

        return (
          <Fragment key={overlay.scheduleId}>
            <Polyline
              positions={path}
              pathOptions={{
                color,
                weight: isOngoing ? 5 : 3,
                opacity: 0.9,
                dashArray: isPending ? "8 6" : undefined,
              }}
            />
            {isOngoing && overlay.stops[truckStopIndex] ? (
              <Marker
                key={`${overlay.scheduleId}-truck`}
                position={[
                  overlay.stops[truckStopIndex].latitude,
                  overlay.stops[truckStopIndex].longitude,
                ]}
                icon={truckIcon()}
                zIndexOffset={1000}
              >
                <Popup>
                  <div className="space-y-1 text-sm">
                    <p className="font-bold text-gray-900">Collection in progress</p>
                    <p className="text-gray-600">
                      {overlay.driver ?? "Driver"} · {overlay.barangay}
                    </p>
                    <p className="text-gray-600">
                      Current stop: {overlay.stops[truckStopIndex].name}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ) : null}
            {overlay.stops.map((stop) => (
              <Marker
                key={`${overlay.scheduleId}-${stop.stopOrder}`}
                position={[stop.latitude, stop.longitude]}
                icon={numberedIcon(stop.stopOrder, stop.status)}
              >
                <Popup>
                  <div className="space-y-1 text-sm">
                    <p className="font-bold text-gray-900">{stop.name}</p>
                    <p className="text-gray-600">
                      {overlay.routeCode} · {overlay.routeName}
                    </p>
                    <p className="text-gray-600">Barangay: {overlay.barangay}</p>
                    {overlay.driver ? (
                      <p className="text-gray-600">Driver: {overlay.driver}</p>
                    ) : null}
                    <p className="font-medium capitalize text-emerald-700">
                      {SCHEDULE_STATUS_CONFIG[overlay.status]?.label ?? overlay.status}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </Fragment>
        );
      })}
      <FitAllBounds overlays={overlays} />
    </MapContainer>
  );
}
