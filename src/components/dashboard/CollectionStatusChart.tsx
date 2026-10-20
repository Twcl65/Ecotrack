"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import type { CollectionStatusItem } from "@/types/dashboard";

type Props = { data: CollectionStatusItem[] };

export default function CollectionStatusChart({ data }: Props) {
  const slices = data.map((d) => ({ name: d.label, value: d.count, color: d.color }));

  return (
    <div className="dashboard-card flex h-full min-h-0 flex-col p-3">
      <h3 className="mb-1 shrink-0 text-sm font-bold text-gray-900">
        Collection Status
      </h3>

      <div className="flex min-h-0 flex-1 items-center gap-2">
        <div className="h-full w-[46%] min-w-[88px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={slices}
                cx="50%"
                cy="50%"
                innerRadius="52%"
                outerRadius="80%"
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {slices.map((s) => (
                  <Cell key={s.name} fill={s.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <ul className="flex-1 space-y-2">
          {data.map((item) => (
            <li key={item.status} className="flex items-center gap-2">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="flex-1 truncate text-[10px] text-gray-600">
                {item.label}
              </span>
              <span className="text-[10px] font-semibold text-gray-900">
                {item.percentage}% ({item.count})
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
