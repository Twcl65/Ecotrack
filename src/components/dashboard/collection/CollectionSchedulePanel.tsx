"use client";

import { CalendarDays, Clock, Info, MapPin, Truck, User } from "lucide-react";
import {
  formatCardDate,
  formatShortDate,
  isOperationalSchedule,
  vehicleForDriver,
} from "@/lib/collection/aggregate";
import type { Schedule } from "@/types/schedules";
import { SCHEDULE_STATUS_CONFIG } from "@/types/schedules";
import CollectionCalendarView from "./CollectionCalendarView";

type Tab = "today" | "calendar";

type Props = {
  tab: Tab;
  onTabChange: (tab: Tab) => void;
  date: string;
  schedules: Schedule[];
  allSchedules: Schedule[];
};

export default function CollectionSchedulePanel({
  tab,
  onTabChange,
  date,
  schedules,
  allSchedules,
}: Props) {
  const todaySchedules = schedules.filter(isOperationalSchedule);
  const primary = todaySchedules[0];

  return (
    <div className="dashboard-card flex h-full min-h-[320px] flex-col overflow-hidden">
      <div className="flex shrink-0 gap-6 border-b border-gray-100 px-4 pt-3">
        <button
          type="button"
          onClick={() => onTabChange("today")}
          className={`pb-2 text-sm font-semibold transition ${
            tab === "today"
              ? "border-b-2 border-eco-primary text-eco-primary"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          Today&apos;s Collection
        </button>
        <button
          type="button"
          onClick={() => onTabChange("calendar")}
          className={`pb-2 text-sm font-semibold transition ${
            tab === "calendar"
              ? "border-b-2 border-eco-primary text-eco-primary"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          Calendar View
        </button>
      </div>

      {tab === "today" ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-eco-light px-3 py-2 text-sm text-eco-dark">
            <CalendarDays className="h-4 w-4 shrink-0" />
            <span>Today is {formatShortDate(date)}</span>
          </div>

          <p className="mb-3 text-sm font-bold text-gray-900">
            Today&apos;s Collection Schedule
          </p>

          {primary ? (
            <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-4">
              <div className="flex gap-4">
                <div className="flex flex-col items-center justify-center rounded-lg bg-white px-3 py-2 shadow-sm">
                  <span className="text-[10px] font-bold text-gray-500">
                    {formatCardDate(primary.date).day}
                  </span>
                  <span className="text-2xl font-black text-gray-900">
                    {formatCardDate(primary.date).date}
                  </span>
                  <span className="text-[10px] font-bold text-gray-500">
                    {formatCardDate(primary.date).month}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-bold text-gray-900">
                      Residual Waste Collection
                    </h4>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        SCHEDULE_STATUS_CONFIG[primary.status].className
                      }`}
                    >
                      {primary.status === "pending"
                        ? "Scheduled"
                        : SCHEDULE_STATUS_CONFIG[primary.status].label}
                    </span>
                  </div>

                  <ul className="mt-3 space-y-2 text-xs text-gray-600">
                    <li className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-eco-primary" />
                      {primary.barangay}
                    </li>
                    <li className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-eco-primary" />
                      {primary.timeStart && primary.timeEnd
                        ? `${primary.timeStart} - ${primary.timeEnd}`
                        : "Time TBD"}
                    </li>
                    <li className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-eco-primary" />
                      Driver: {primary.driver ?? "Unassigned"}
                    </li>
                    <li className="flex items-center gap-2">
                      <Truck className="h-3.5 w-3.5 text-eco-primary" />
                      Vehicle: {vehicleForDriver(primary.driver)}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500">
              No collection scheduled for this date.
            </p>
          )}

          {todaySchedules.length > 1 ? (
            <div className="mt-3 space-y-2">
              {todaySchedules.slice(1).map((s) => (
                <div
                  key={s.id}
                  className="rounded-lg border border-gray-100 px-3 py-2 text-xs"
                >
                  <p className="font-semibold text-gray-800">{s.barangay}</p>
                  <p className="text-gray-500">
                    {s.timeStart ?? "TBD"} · {s.driver ?? "Unassigned"}
                  </p>
                </div>
              ))}
            </div>
          ) : null}

          <div className="mt-auto flex items-start gap-2 rounded-lg bg-blue-50 px-3 py-2 text-[11px] text-blue-800">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Only one collection is scheduled per day.
          </div>
        </div>
      ) : (
        <CollectionCalendarView schedules={allSchedules} selectedDate={date} />
      )}
    </div>
  );
}
