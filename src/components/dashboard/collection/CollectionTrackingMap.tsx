"use client";

import { Home, Minus, Plus, Truck } from "lucide-react";
import type { CollectionMapMarker } from "@/types/collection-monitoring";
import { SCHEDULE_STATUS_CONFIG } from "@/types/schedules";
import type { ScheduleStatus } from "@/types/schedules";

type Props = { markers: CollectionMapMarker[] };

const LEGEND: { label: string; status: ScheduleStatus | "default"; color: string }[] = [
  { label: "On Route", status: "ongoing", color: "#056636" },
  { label: "On Collection", status: "pending", color: "#3b82f6" },
  { label: "Pending", status: "pending", color: "#f59e0b" },
  { label: "Completed", status: "completed", color: "#9ca3af" },
];

function markerColor(status: ScheduleStatus): string {
  return SCHEDULE_STATUS_CONFIG[status]?.dotColor ?? "#9ca3af";
}

export default function CollectionTrackingMap({ markers }: Props) {
  const routePoints =
    markers.length > 1
      ? markers.map((m) => `${m.x},${m.y}`).join(" ")
      : "";

  return (
    <div className="dashboard-card flex h-full min-h-[320px] flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3">
        <h3 className="text-sm font-bold text-gray-900">Live Collection Tracking</h3>
        <select className="rounded-lg border border-gray-200 px-2 py-1 text-xs outline-none">
          <option>Map View</option>
        </select>
      </div>

      <div className="relative min-h-[240px] flex-1 bg-gradient-to-br from-emerald-50 via-sky-50 to-blue-100">
        <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#cbd5e1" strokeWidth="0.15" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" opacity="0.35" />

          {routePoints ? (
            <polyline
              points={routePoints}
              fill="none"
              stroke="#056636"
              strokeWidth="0.8"
              strokeDasharray="2 1.5"
              opacity="0.85"
            />
          ) : null}

          {markers.map((m) => (
            <g key={m.barangay} transform={`translate(${m.x}, ${m.y})`}>
              <circle r="3.2" fill={markerColor(m.status)} opacity="0.25" />
              <circle r="1.6" fill={markerColor(m.status)} />
              <text
                y="-4"
                textAnchor="middle"
                fontSize="3"
                fill="#334155"
                fontWeight="600"
              >
                {m.barangay}
              </text>
            </g>
          ))}

          {markers.find((m) => m.status === "ongoing") ? (
            <g
              transform={`translate(${markers.find((m) => m.status === "ongoing")!.x - 4}, ${markers.find((m) => m.status === "ongoing")!.y - 2})`}
            >
              <rect width="8" height="4" rx="1" fill="#056636" />
              <text x="4" y="2.8" textAnchor="middle" fontSize="2.2" fill="white">
                TRK
              </text>
            </g>
          ) : null}
        </svg>

        <div className="absolute bottom-3 left-3 rounded-lg bg-white/95 p-2 shadow-sm">
          <ul className="space-y-1">
            {LEGEND.map((item) => (
              <li key={item.label} className="flex items-center gap-2 text-[10px] text-gray-600">
                {item.label === "On Route" ? (
                  <Truck className="h-3 w-3 text-emerald-700" />
                ) : item.label === "On Collection" ? (
                  <Home className="h-3 w-3 text-blue-600" />
                ) : (
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                )}
                {item.label}
              </li>
            ))}
          </ul>
        </div>

        <div className="absolute bottom-3 right-3 flex flex-col gap-1">
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-md bg-white shadow-sm"
            aria-label="Zoom in"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-md bg-white shadow-sm"
            aria-label="Zoom out"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
