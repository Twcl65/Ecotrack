"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CollectionTrendPoint } from "@/types/dashboard";

type Props = { data: CollectionTrendPoint[] };

export default function CollectionsOverTimeChart({ data }: Props) {
  return (
    <div className="dashboard-card flex h-full min-h-0 flex-col p-3">
      <div className="mb-1 flex shrink-0 items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900">Collections Over Time</h3>
        <button
          type="button"
          className="rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-600"
        >
          This Month
        </button>
      </div>
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 6, left: -14, bottom: 0 }}>
            <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: "#9ca3af" }}
              interval={5}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 9, fill: "#9ca3af" }}
              width={22}
              domain={[0, 25]}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5e7eb" }}
            />
            <Line
              type="monotone"
              dataKey="collections"
              stroke="#056636"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#056636" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
