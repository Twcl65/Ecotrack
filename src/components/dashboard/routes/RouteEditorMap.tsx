"use client";

import L from "leaflet";
import { MapContainer, Marker, Polyline, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { useEffect } from "react";
import type { RouteFormStop } from "@/types/routes";
import { JASAAN_MAP_CENTER } from "@/lib/routes/geo";
import "leaflet/dist/leaflet.css";

type Props = {
  stops: RouteFormStop[];
  onAddStop: (lat: number, lng: number) => void;
  className?: string;
};

function numberedIcon(order: number, total: number) {
  const bg =
    order === 1 ? "#056636" : order === total && total > 1 ? "#dc2626" : "#059669";

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

function MapClickHandler({ onAddStop }: { onAddStop: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onAddStop(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FitStops({ stops }: { stops: RouteFormStop[] }) {
  const map = useMap();

  useEffect(() => {
    if (stops.length === 0) {
      map.setView(JASAAN_MAP_CENTER, 14);
      return;
    }
    const bounds = L.latLngBounds(stops.map((s) => [s.latitude, s.longitude]));
    map.fitBounds(bounds, { padding: [32, 32], maxZoom: 15 });
  }, [map, stops]);

  return null;
}

export default function RouteEditorMap({ stops, onAddStop, className = "" }: Props) {
  const path: [number, number][] = stops.map((s) => [s.latitude, s.longitude]);
  const total = stops.length;

  return (
    <div className={`overflow-hidden rounded-lg border border-gray-200 ${className}`}>
      <MapContainer
        center={JASAAN_MAP_CENTER}
        zoom={14}
        scrollWheelZoom
        className="h-full w-full cursor-crosshair"
        style={{ minHeight: 280 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {path.length >= 2 && (
          <Polyline positions={path} pathOptions={{ color: "#056636", weight: 4 }} />
        )}
        {stops.map((stop, index) => (
          <Marker
            key={stop.clientId}
            position={[stop.latitude, stop.longitude]}
            icon={numberedIcon(index + 1, total)}
          />
        ))}
        <MapClickHandler onAddStop={onAddStop} />
        <FitStops stops={stops} />
      </MapContainer>
    </div>
  );
}
