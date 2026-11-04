"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { Clock, Leaf, MapPin, Truck, X } from "lucide-react";
import { useEffect } from "react";
import type {
  CollectionActivity,
  CollectionProgressSlice,
} from "@/types/collection-monitoring";

type Props = {
  slices: CollectionProgressSlice[];
  overallPercent: number;
  activities: CollectionActivity[];
  activityDialogOpen: boolean;
  onOpenActivityDialog: () => void;
  onCloseActivityDialog: () => void;
};

const TONE_ICON = {
  success: Truck,
  info: MapPin,
  warning: Clock,
};

const TONE_CLASS = {
  success: "bg-emerald-100 text-emerald-700",
  info: "bg-blue-100 text-blue-700",
  warning: "bg-amber-100 text-amber-700",
};

function ActivityItem({
  item,
  showDate = false,
}: {
  item: CollectionActivity;
  showDate?: boolean;
}) {
  const Icon = TONE_ICON[item.tone];

  return (
    <li className="flex gap-2">
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${TONE_CLASS[item.tone]}`}
      >
        <Icon className="h-3 w-3" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] leading-snug text-gray-700">{item.message}</p>
        <p className="mt-0.5 text-[10px] text-gray-400">
          {showDate ? `${item.dateLabel} · ` : ""}
          {item.timeLabel}
        </p>
      </div>
    </li>
  );
}

export default function CollectionProgressPanel({
  slices,
  overallPercent,
  activities,
  activityDialogOpen,
  onOpenActivityDialog,
  onCloseActivityDialog,
}: Props) {
  const chartData = slices.filter((s) => s.count > 0);

  useEffect(() => {
    if (!activityDialogOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onCloseActivityDialog();
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [activityDialogOpen, onCloseActivityDialog]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 overflow-hidden">
      <div className="dashboard-card shrink-0 p-3">
        <h3 className="mb-2 text-sm font-bold text-gray-900">Today&apos;s Progress</h3>

        <div className="flex items-center gap-3">
          <div className="relative h-[108px] w-[108px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={
                    chartData.length > 0
                      ? chartData.map((s) => ({
                          name: s.label,
                          value: s.count,
                          color: s.color,
                        }))
                      : [{ name: "Empty", value: 1, color: "#e5e7eb" }]
                  }
                  cx="50%"
                  cy="50%"
                  innerRadius="58%"
                  outerRadius="85%"
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {(chartData.length > 0
                    ? chartData
                    : [{ label: "Empty", count: 1, color: "#e5e7eb", status: "pending" as const }]
                  ).map((s) => (
                    <Cell key={s.label} fill={s.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-base font-black text-gray-900">{overallPercent}%</span>
              <span className="text-[8px] text-gray-500">Overall Progress</span>
            </div>
          </div>

          <ul className="min-w-0 flex-1 space-y-1.5">
            {slices.map((item) => (
              <li key={item.status} className="flex items-center gap-2 text-[11px]">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="flex-1 truncate text-gray-600">{item.label}</span>
                <span className="font-semibold text-gray-900">{item.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="dashboard-card flex shrink-0 items-center gap-2 px-3 py-2 text-[11px] leading-snug text-eco-dark">
        <Leaf className="h-3.5 w-3.5 shrink-0 text-eco-primary" />
        <span>Let&apos;s keep Jasaan clean and green! Thank you for your hard work.</span>
      </div>

      <div className="dashboard-card flex min-h-0 flex-1 flex-col overflow-hidden p-3">
        <div className="mb-2 flex shrink-0 items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">Recent Activity</h3>
          <button
            type="button"
            onClick={onOpenActivityDialog}
            className="text-[11px] font-semibold text-eco-primary hover:underline"
          >
            View All
          </button>
        </div>
        <ul className="min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-0.5">
          {activities.length === 0 ? (
            <li className="text-xs text-gray-500">No recent activity.</li>
          ) : (
            activities.slice(0, 5).map((item) => (
              <ActivityItem key={item.id} item={item} />
            ))
          )}
        </ul>
      </div>

      {activityDialogOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={onCloseActivityDialog}
            aria-label="Close activity dialog"
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="collection-activity-title"
            className="relative z-10 flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-xl"
          >
            <header className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div>
                <h2
                  id="collection-activity-title"
                  className="text-lg font-bold text-gray-900"
                >
                  All Collection Activity
                </h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  {activities.length} {activities.length === 1 ? "activity" : "activities"}
                </p>
              </div>
              <button
                type="button"
                onClick={onCloseActivityDialog}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </header>
            <ul className="min-h-0 space-y-3 overflow-y-auto p-5">
              {activities.length === 0 ? (
                <li className="text-sm text-gray-500">No activity to show.</li>
              ) : (
                activities.map((item) => (
                  <ActivityItem key={item.id} item={item} showDate />
                ))
              )}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
