"use client";

import {
  AlertTriangle,
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Megaphone,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  AnnouncementStatusBadge,
  AnnouncementTypeBadge,
} from "./AnnouncementBadges";
import type {
  Announcement,
  AnnouncementDisplayStatus,
  AnnouncementType,
} from "@/types/announcement";
import {
  ANNOUNCEMENT_STATUS_CONFIG,
  ANNOUNCEMENT_TYPE_OPTIONS,
} from "@/types/announcement";

type Props = {
  announcements: Announcement[];
  onView: (announcement: Announcement) => void;
  onEdit: (announcement: Announcement) => void;
  onDelete: (announcement: Announcement) => void;
};

const PAGE_SIZE = 8;

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white py-2 px-3 text-sm outline-none focus:border-eco-primary focus:ring-2 focus:ring-eco-primary/20";

const TYPE_ICONS = {
  schedule: Calendar,
  notice: AlertTriangle,
  general: FileText,
  guidelines: BookOpen,
};

export default function AnnouncementTable({
  announcements,
  onView,
  onEdit,
  onDelete,
}: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    AnnouncementDisplayStatus | "all"
  >("all");
  const [typeFilter, setTypeFilter] = useState<AnnouncementType | "all">("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return announcements.filter((a) => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (typeFilter !== "all" && a.type !== typeFilter) return false;

      const posted = a.publishedAt ?? a.created_at;
      if (fromDate && posted.slice(0, 10) < fromDate) return false;
      if (toDate && posted.slice(0, 10) > toDate) return false;

      if (!q) return true;
      return (
        a.title.toLowerCase().includes(q) ||
        a.subtitle.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q)
      );
    });
  }, [announcements, search, statusFilter, typeFilter, fromDate, toDate]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, typeFilter, fromDate, toDate]);

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
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="mb-3 flex shrink-0 flex-wrap items-end gap-3">
        <div className="relative min-w-[160px] flex-1 sm:max-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search announcements..."
            className={`${inputClass} pl-9`}
          />
        </div>

        <FilterSelect
          className="w-full sm:w-[130px]"
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v as AnnouncementDisplayStatus | "all");
            setPage(1);
          }}
          options={[
            { value: "all", label: "All Status" },
            ...Object.entries(ANNOUNCEMENT_STATUS_CONFIG).map(([value, cfg]) => ({
              value,
              label: cfg.label,
            })),
          ]}
        />

        <FilterSelect
          className="w-full sm:w-[130px]"
          value={typeFilter}
          onChange={(v) => {
            setTypeFilter(v as AnnouncementType | "all");
            setPage(1);
          }}
          options={[
            { value: "all", label: "All Types" },
            ...ANNOUNCEMENT_TYPE_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            })),
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

      <div className="dashboard-card flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50/95">
              <tr>
                {[
                  "Title",
                  "Type",
                  "Status",
                  "Date Posted",
                  "Expiry Date",
                  "Views",
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
                    No announcements found. Click &quot;New Announcement&quot; to
                    create one.
                  </td>
                </tr>
              ) : (
                pageItems.map((row) => {
                  const Icon = TYPE_ICONS[row.type] ?? Megaphone;
                  return (
                    <tr
                      key={row.id}
                      className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-eco-light text-eco-primary">
                            <Icon className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900">
                              {row.title}
                            </p>
                            <p className="truncate text-xs text-gray-500">
                              {row.subtitle}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <AnnouncementTypeBadge type={row.type} />
                      </td>
                      <td className="px-4 py-3">
                        <AnnouncementStatusBadge status={row.status} />
                      </td>
                      <td className="px-4 py-3 text-gray-800">
                        <div>{row.postedDateLabel}</div>
                        <div className="text-xs text-gray-500">
                          {row.postedTimeLabel}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-800">
                        {row.expiryDateLabel ? (
                          <>
                            <div>{row.expiryDateLabel}</div>
                            <div className="text-xs text-gray-500">
                              {row.expiryTimeLabel}
                            </div>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-800">{row.views}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onView(row)}
                            className="rounded-md p-1.5 text-eco-primary hover:bg-eco-light"
                            aria-label="View announcement"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onEdit(row)}
                            className="rounded-md p-1.5 text-eco-primary hover:bg-eco-light"
                            aria-label="Edit announcement"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(row)}
                            className="rounded-md p-1.5 text-red-500 hover:bg-red-50"
                            aria-label="Delete announcement"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex shrink-0 items-center justify-between border-t border-gray-100 px-4 py-2">
          <p className="text-xs text-gray-500">
            Showing {rangeStart} to {rangeEnd} of {filtered.length} announcements
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
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                type="button"
                onClick={() => setPage(pageNum)}
                className={`flex h-8 w-8 items-center justify-center rounded-md text-sm font-semibold ${
                  pageNum === currentPage
                    ? "bg-eco-primary text-white"
                    : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
                aria-label={`Page ${pageNum}`}
                aria-current={pageNum === currentPage ? "page" : undefined}
              >
                {pageNum}
              </button>
            ))}
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
    <div className={className}>
      <label className="mb-1.5 block text-xs font-medium text-gray-600">
        &nbsp;
      </label>
      <div className="relative">
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
    </div>
  );
}
