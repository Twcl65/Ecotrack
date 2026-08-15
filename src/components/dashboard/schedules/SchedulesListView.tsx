"use client";

import { ChevronLeft, ChevronRight, Pencil, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import ScheduleStatusBadge from "./ScheduleStatusBadge";
import type { Schedule } from "@/types/schedules";

type Props = {
  schedules: Schedule[];
  onEdit: (schedule: Schedule) => void;
  onDelete: (schedule: Schedule) => void;
};

const PAGE_SIZE = 7;

export default function SchedulesListView({
  schedules,
  onEdit,
  onDelete,
}: Props) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return schedules;
    return schedules.filter(
      (s) =>
        s.barangay.toLowerCase().includes(q) ||
        s.dateLabel.toLowerCase().includes(q) ||
        (s.driver?.toLowerCase().includes(q) ?? false)
    );
  }, [schedules, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-3 flex shrink-0 items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-gray-900 sm:text-base">
            Collection Schedules
          </h2>
          <p className="mt-0.5 text-xs text-gray-500">
            View and manage waste collection schedules by barangay, time, driver,
            and status across Jasaan.
          </p>
        </div>
        <div className="relative w-full max-w-xs shrink-0">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search schedule"
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-eco-primary focus:ring-2 focus:ring-eco-primary/20"
          />
        </div>
      </div>

      <div className="dashboard-card min-h-0 flex-1 overflow-hidden">
        <div className="h-full overflow-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50/95">
              <tr>
                {["Date", "Barangay", "Time", "Driver", "Status", "Action"].map(
                  (col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-gray-700"
                    >
                      {col}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {pageItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-sm text-gray-500"
                  >
                    No schedules found. Click &quot;Add Schedule&quot; to create one.
                  </td>
                </tr>
              ) : (
                pageItems.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-gray-800">
                    {row.dateLabel}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {row.barangay}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                    {row.timeStart && row.timeEnd
                      ? `${row.timeStart} - ${row.timeEnd}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-800">{row.driver ?? "—"}</td>
                  <td className="px-4 py-3">
                    <ScheduleStatusBadge status={row.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(row)}
                        className="rounded-md p-1.5 text-eco-primary hover:bg-eco-light"
                        aria-label="Edit schedule"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(row)}
                        className="rounded-md p-1.5 text-red-500 hover:bg-red-50"
                        aria-label="Delete schedule"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-3 flex shrink-0 items-center justify-between">
        <p className="text-xs text-gray-500">
          Showing {pageItems.length} of {filtered.length} entries
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="rounded-md border border-gray-200 p-1.5 text-gray-600 disabled:opacity-40"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-eco-primary text-sm font-semibold text-white">
            {currentPage}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="rounded-md border border-gray-200 p-1.5 text-gray-600 disabled:opacity-40"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
