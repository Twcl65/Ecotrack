"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ReportBarangayPoint } from "@/types/reports";

type Props = { data: ReportBarangayPoint[] };

export default function ReportBarangayChart({ data }: Props) {
  return (
    <div className="dashboard-card flex h-full min-h-[220px] flex-col p-3">
      <div className="mb-1 flex shrink-0 items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900">
          Top Barangays by Collections
        </h3>
        <span className="rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-600">
          This Month
        </span>
      </div>
      <div className="min-h-0 flex-1">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-gray-500">
            No collection data for this period.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 4, right: 8, left: 4, bottom: 0 }}
            >
              <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 9, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="barangay"
                width={72}
                tick={{ fontSize: 9, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 11,
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                }}
              />
              <Bar dataKey="collections" fill="#056636" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
