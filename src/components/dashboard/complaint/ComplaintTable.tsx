"use client";

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Search,
  Trash2,
  User,
} from "lucide-react";
import { useMemo, useState } from "react";
import ComplaintStatusBadge from "./ComplaintStatusBadge";
import type { Complaint, ComplaintStatus } from "@/types/complaint";
import { COMPLAINT_STATUS_OPTIONS } from "@/types/complaint";

type Props = {
  complaints: Complaint[];
  barangayOptions: string[];
  onView: (complaint: Complaint) => void;
  onEdit: (complaint: Complaint) => void;
  onDelete: (complaint: Complaint) => void;
};

const PAGE_SIZE = 4;

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white py-2 px-3 text-sm outline-none focus:border-eco-primary focus:ring-2 focus:ring-eco-primary/20";

export default function ComplaintTable({
  complaints,
  barangayOptions,
  onView,
  onEdit,
  onDelete,
}: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | "all">(
    "all"
  );
  const [barangayFilter, setBarangayFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return complaints.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (barangayFilter !== "all" && c.barangay !== barangayFilter)
        return false;

      if (fromDate) {
        const from = new Date(`${fromDate}T00:00:00`);
        if (new Date(c.filedAt) < from) return false;
      }
      if (toDate) {
        const to = new Date(`${toDate}T23:59:59`);
        if (new Date(c.filedAt) > to) return false;
      }

      if (!q) return true;
      return (
        c.complaintCode.toLowerCase().includes(q) ||
        c.complainantName.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.barangay.toLowerCase().includes(q) ||
        c.issue.toLowerCase().includes(q)
      );
    });
  }, [complaints, search, statusFilter, barangayFilter, fromDate, toDate]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );
  const rangeStart =
    filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, filtered.length);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-3 flex shrink-0 flex-wrap items-end gap-3">
        <div className="relative w-full min-w-[140px] flex-1 sm:max-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search complaints"
            className={`${inputClass} pl-9`}
          />
        </div>

        <FilterSelect
          className="w-full sm:w-[140px]"
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v as ComplaintStatus | "all");
            setPage(1);
          }}
          options={[
            { value: "all", label: "All Status" },
            ...COMPLAINT_STATUS_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            })),
          ]}
        />

        <FilterSelect
          className="w-full sm:w-[140px]"
          value={barangayFilter}
          onChange={(v) => {
            setBarangayFilter(v);
            setPage(1);
          }}
          options={[
            { value: "all", label: "All barangay" },
            ...barangayOptions.map((b) => ({ value: b, label: b })),
          ]}
        />

        <FilterField label="From Date" className="w-full sm:w-[150px]">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setPage(1);
            }}
            className={inputClass}
          />
        </FilterField>

        <FilterField label="To Date" className="w-full sm:w-[150px]">
          <input
            type="date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setPage(1);
            }}
            className={inputClass}
          />
        </FilterField>
      </div>

      <div className="dashboard-card min-h-0 flex-1 overflow-hidden">
        <div className="h-full overflow-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50/95">
              <tr>
                {[
                  "ID",
                  "Complainant",
                  "Barangay",
                  "Issue",
                  "Status",
                  "Date Filed",
                  "Action",
                ].map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-gray-700"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-sm text-gray-500"
                  >
                    No complaints found.
                  </td>
                </tr>
              ) : (
                pageItems.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {row.complaintCode}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {row.complainantName}
                          </p>
                          <p className="text-xs text-gray-500">{row.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-800">{row.barangay}</td>
                    <td className="max-w-[180px] truncate px-4 py-3 text-gray-800">
                      {row.issue}
                    </td>
                    <td className="px-4 py-3">
                      <ComplaintStatusBadge status={row.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-800">{row.dateLabel}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onView(row)}
                          className="rounded-md p-1.5 text-eco-primary hover:bg-eco-light"
                          aria-label="View complaint"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEdit(row)}
                          className="rounded-md p-1.5 text-eco-primary hover:bg-eco-light"
                          aria-label="Edit complaint"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(row)}
                          className="rounded-md p-1.5 text-red-500 hover:bg-red-50"
                          aria-label="Delete complaint"
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
          Showing {rangeStart} to {rangeEnd} of {filtered.length} complaints
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

function FilterField({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-xs font-medium text-gray-600">
        {label}
      </label>
      {children}
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <div className={`relative shrink-0 ${className ?? ""}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass} appearance-none pr-8`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
    </div>
  );
}
