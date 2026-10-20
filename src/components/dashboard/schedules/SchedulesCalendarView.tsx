"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import type { Schedule } from "@/types/schedules";
import { SCHEDULE_STATUS_CONFIG } from "@/types/schedules";

type Props = { schedules: Schedule[]; holidayDates: (string | null)[] };

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const LEGEND_STATUSES = [
  "ongoing",
  "pending",
  "completed",
  "canceled",
  "maintenance",
] as const;

function buildCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];

  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
}

function localDateKey(value: string): string {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function SchedulesCalendarView({ schedules, holidayDates }: Props) {
  const [viewDate, setViewDate] = useState(() => new Date());

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthLabel = viewDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const cells = useMemo(() => buildCalendarDays(year, month), [year, month]);

  const schedulesByDay = useMemo(() => {
    const map = new Map<number, Schedule[]>();
    schedules.forEach((s) => {
      const [scheduleYear, scheduleMonth, scheduleDay] = s.date.split("-").map(Number);
      if (scheduleYear === year && scheduleMonth - 1 === month) {
        const list = map.get(scheduleDay) ?? [];
        list.push(s);
        map.set(scheduleDay, list);
      }
    });
    return map;
  }, [schedules, year, month]);
  const holidaysByDay = useMemo(() => {
    const days = new Set<number>();
    holidayDates.forEach((value) => {
      if (!value) return;
      const [holidayYear, holidayMonth, holidayDay] = localDateKey(value).split("-").map(Number);
      if (holidayYear === year && holidayMonth - 1 === month) days.add(holidayDay);
    });
    return days;
  }, [holidayDates, year, month]);

  function prevMonth() {
    setViewDate(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    setViewDate(new Date(year, month + 1, 1));
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-3 flex shrink-0 items-center justify-center gap-3">
        <button
          type="button"
          onClick={prevMonth}
          className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-50"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h2 className="min-w-[140px] text-center text-base font-bold text-gray-900">
          {monthLabel}
        </h2>
        <button
          type="button"
          onClick={nextMonth}
          className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-50"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="dashboard-card flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="grid shrink-0 grid-cols-7 bg-eco-primary text-center text-xs font-bold text-white">
          {WEEKDAYS.map((day) => (
            <div key={day} className="border-r border-white/10 py-2 last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-6">
          {cells.map((day, idx) => {
            const daySchedules = day ? schedulesByDay.get(day) ?? [] : [];
            const holiday = Boolean(day && holidaysByDay.has(day));
            const primarySchedule = daySchedules[0];
            return (
              <div
                key={idx}
                className="flex min-h-[52px] flex-col border-b border-r border-gray-100 p-1.5 last:border-r-0"
              >
                {day && (
                  <>
                    <span
                      className={`text-xs font-bold ${holiday ? "text-purple-700" : primarySchedule ? "text-eco-primary" : "text-gray-700"}`}
                    >
                      {day}
                    </span>
                    {(holiday || daySchedules.length > 0) && (
                      <div className="mt-auto flex flex-col gap-0.5">
                        {holiday && (
                          <span className="block truncate rounded bg-purple-100 px-1 py-0.5 text-[9px] font-semibold text-purple-700">
                            Holiday
                          </span>
                        )}
                        {primarySchedule && (
                          <span
                            className="block truncate rounded px-1 py-0.5 text-[9px] font-medium"
                            style={{
                              backgroundColor: `${SCHEDULE_STATUS_CONFIG[primarySchedule.status].dotColor}22`,
                              color: SCHEDULE_STATUS_CONFIG[primarySchedule.status].dotColor,
                            }}
                            title={`${primarySchedule.barangay} — ${SCHEDULE_STATUS_CONFIG[primarySchedule.status].label}`}
                          >
                            {primarySchedule.barangay}
                          </span>
                        )}
                        {daySchedules.length > 1 && (
                          <span className="text-[8px] text-gray-500">
                            +{daySchedules.length - 1} more
                          </span>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3 flex shrink-0 flex-wrap items-center justify-center gap-4">
        {LEGEND_STATUSES.map((status) => (
          <div key={status} className="flex items-center gap-1.5">
            <span
              className="h-1 w-6 rounded-full"
              style={{ backgroundColor: SCHEDULE_STATUS_CONFIG[status].dotColor }}
            />
            <span className="text-xs text-gray-600">
              {SCHEDULE_STATUS_CONFIG[status].label}
            </span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-purple-600" />
          <span className="text-xs text-gray-600">Holiday</span>
        </div>
      </div>
    </div>
  );
}
