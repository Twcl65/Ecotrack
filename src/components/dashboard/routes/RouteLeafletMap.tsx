"use client";

import L from "leaflet";
import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";
import { useEffect } from "react";
import type { RouteStop } from "@/types/routes";
import "leaflet/dist/leaflet.css";

type Props = {
  stops: RouteStop[];
  className?: string;
};

function FitBounds({ stops }: { stops: RouteStop[] }) {
  const map = useMap();

  useEffect(() => {
    if (stops.length === 0) return;
    const bounds = L.latLngBounds(stops.map((s) => [s.latitude, s.longitude]));
    map.fitBounds(bounds, { padding: [24, 24], maxZoom: 15 });
  }, [map, stops]);

  return null;
}

function numberedIcon(order: number, status: RouteStop["status"]) {
  const bg =
    status === "start"
      ? "#056636"
      : status === "end"
        ? "#dc2626"
        : "#059669";

  return L.divIcon({
    className: "",
    html: `<div style="
      width:26px;height:26px;border-radius:50%;
      background:${bg};color:#fff;font-size:11px;font-weight:700;
      display:flex;align-items:center;justify-content:center;
      border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.25);
    ">${order}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

export default function RouteLeafletMap({ stops, className = "" }: Props) {
  if (stops.length === 0) {
    return (
      <div className={`flex items-center justify-center rounded-lg bg-gray-100 text-sm text-gray-500 ${className}`}>
        No route stops available
      </div>
    );
  }

  const center: [number, number] = [stops[0].latitude, stops[0].longitude];
  const path: [number, number][] = stops.map((s) => [s.latitude, s.longitude]);

  return (
    <div className={`overflow-hidden rounded-lg ${className}`}>
      <MapContainer
        center={center}
        zoom={14}
        scrollWheelZoom={false}
        className="h-full w-full"
        style={{ minHeight: 220 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polyline positions={path} pathOptions={{ color: "#056636", weight: 4 }} />
        {stops.map((stop) => (
          <Marker
            key={stop.id}
            position={[stop.latitude, stop.longitude]}
            icon={numberedIcon(stop.stopOrder, stop.status)}
          />
        ))}
        <FitBounds stops={stops} />
      </MapContainer>
    </div>
  );
}
