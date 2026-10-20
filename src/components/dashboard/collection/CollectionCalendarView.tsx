"use client";

import { useMemo } from "react";
import type { Schedule } from "@/types/schedules";
import { SCHEDULE_STATUS_CONFIG } from "@/types/schedules";

type Props = {
  schedules: Schedule[];
  selectedDate: string;
};

export default function CollectionCalendarView({
  schedules,
  selectedDate,
}: Props) {
  const monthLabel = useMemo(() => {
    const d = new Date(`${selectedDate}T12:00:00`);
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, [selectedDate]);

  const monthSchedules = useMemo(() => {
    const month = selectedDate.slice(0, 7);
    return schedules.filter((s) => s.date.startsWith(month));
  }, [schedules, selectedDate]);

  const byDate = useMemo(() => {
    const map = new Map<string, Schedule[]>();
    for (const s of monthSchedules) {
      const list = map.get(s.date) ?? [];
      list.push(s);
      map.set(s.date, list);
    }
    return map;
  }, [monthSchedules]);

  const days = useMemo(() => {
    const [y, m] = selectedDate.split("-").map(Number);
    const first = new Date(y, m - 1, 1);
    const last = new Date(y, m, 0);
    const items: { date: string; day: number }[] = [];
    for (let d = 1; d <= last.getDate(); d++) {
      const date = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      items.push({ date, day: d });
    }
    return { items, startPad: first.getDay() };
  }, [selectedDate]);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-4">
      <p className="mb-3 text-sm font-bold text-gray-900">{monthLabel}</p>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-gray-400">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {Array.from({ length: days.startPad }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {days.items.map(({ date, day }) => {
          const dayList = byDate.get(date) ?? [];
          const primary = dayList[0];
          const isSelected = date === selectedDate;
          return (
            <div
              key={date}
              className={`min-h-[52px] rounded-md border p-1 text-left ${
                isSelected
                  ? "border-eco-primary bg-eco-light"
                  : "border-gray-100 bg-white"
              }`}
            >
              <span className="text-[10px] font-semibold text-gray-700">{day}</span>
              {primary ? (
                <div
                  className="mt-0.5 truncate rounded px-1 py-0.5 text-[8px] font-medium text-white"
                  style={{
                    backgroundColor: SCHEDULE_STATUS_CONFIG[primary.status].dotColor,
                  }}
                  title={`${primary.barangay} — ${SCHEDULE_STATUS_CONFIG[primary.status].label}`}
                >
                  {primary.barangay.split(" ")[0]}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
