"use client";

import { CalendarDays } from "lucide-react";
import { STATUS_OPTIONS, SCHEDULE_STATUS_CONFIG } from "@/types/schedules";

type Props = {
  barangayOptions: string[];
  driverOptions: string[];
  barangay: string;
  driver: string;
  status: string;
  date: string;
  onBarangayChange: (value: string) => void;
  onDriverChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onDateChange: (value: string) => void;
};

const selectClass =
  "rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-8 text-sm outline-none focus:border-eco-primary focus:ring-2 focus:ring-eco-primary/20";

export default function CollectionMonitoringFilters({
  barangayOptions,
  driverOptions,
  barangay,
  driver,
  status,
  date,
  onBarangayChange,
  onDriverChange,
  onStatusChange,
  onDateChange,
}: Props) {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      <select
        value={barangay}
        onChange={(e) => onBarangayChange(e.target.value)}
        className={selectClass}
      >
        <option value="all">All Barangays</option>
        {barangayOptions.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>

      <select
        value={driver}
        onChange={(e) => onDriverChange(e.target.value)}
        className={selectClass}
      >
        <option value="all">All Drivers</option>
        {driverOptions.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>

      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
        className={selectClass}
      >
        <option value="all">All Status</option>
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {SCHEDULE_STATUS_CONFIG[s].label}
          </option>
        ))}
      </select>

      <div className="relative ml-auto flex items-center gap-2">
        <CalendarDays className="pointer-events-none absolute left-3 h-4 w-4 text-gray-400" />
        <input
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          className={`${selectClass} pl-9`}
        />
      </div>
    </div>
  );
}
