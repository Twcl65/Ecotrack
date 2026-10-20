"use client";

import dynamic from "next/dynamic";
import { Truck } from "lucide-react";
import type { CollectionRouteOverlay } from "@/types/collection-monitoring";
import { SCHEDULE_STATUS_CONFIG } from "@/types/schedules";
import type { ScheduleStatus } from "@/types/schedules";

const CollectionTrackingLeafletMap = dynamic(
  () => import("./CollectionTrackingLeafletMap"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[240px] items-center justify-center bg-gray-50 text-sm text-gray-500">
        Loading map...
      </div>
    ),
  }
);

type Props = {
  overlays: CollectionRouteOverlay[];
};

const LEGEND: { label: string; status: ScheduleStatus }[] = [
  { label: "Ongoing", status: "ongoing" },
  { label: "Pending", status: "pending" },
  { label: "Completed", status: "completed" },
  { label: "Canceled", status: "canceled" },
];

export default function CollectionTrackingMap({ overlays }: Props) {
  return (
    <div className="dashboard-card flex h-full min-h-[320px] flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Live Collection Tracking</h3>
          <p className="text-xs text-gray-500">
            {overlays.length} scheduled route{overlays.length === 1 ? "" : "s"} on map
          </p>
        </div>
      </div>

      <div className="relative min-h-[240px] flex-1">
        <CollectionTrackingLeafletMap overlays={overlays} />

        <div className="pointer-events-none absolute bottom-3 left-3 z-[1000] rounded-lg bg-white/95 p-2 shadow-sm">
          <ul className="space-y-1">
            {LEGEND.map((item) => (
              <li key={item.label} className="flex items-center gap-2 text-[10px] text-gray-600">
                {item.status === "ongoing" ? (
                  <Truck className="h-3 w-3 text-emerald-700" />
                ) : (
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor: SCHEDULE_STATUS_CONFIG[item.status].dotColor,
                    }}
                  />
                )}
                {item.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
