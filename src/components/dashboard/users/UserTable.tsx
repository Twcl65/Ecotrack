"use client";

import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { formatPhoneDisplay } from "@/lib/users/format";
import { UserRoleBadge, UserStatusBadge } from "./UserBadges";
import type { SystemUser, UserRole, UserStatus } from "@/types/user";
import { USER_ROLE_OPTIONS, USER_STATUS_CONFIG } from "@/types/user";

type Props = {
  users: SystemUser[];
  onView: (user: SystemUser) => void;
  onEdit: (user: SystemUser) => void;
  onDelete: (user: SystemUser) => void;
};

const PAGE_SIZE = 8;

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white py-2 px-3 text-sm outline-none focus:border-eco-primary focus:ring-2 focus:ring-eco-primary/20";

export default function UserTable({
  users,
  onView,
  onEdit,
  onDelete,
}: Props) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "all">("all");
  const [createdDate, setCreatedDate] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (statusFilter !== "all" && u.status !== statusFilter) return false;
      if (createdDate && u.createdAt.slice(0, 10) !== createdDate) return false;

      if (!q) return true;
      return (
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.userCode.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.phone.includes(q)
      );
    });
  }, [users, search, roleFilter, statusFilter, createdDate]);

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, statusFilter, createdDate]);

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
            placeholder="Search users"
            className={`${inputClass} pl-9`}
          />
        </div>

        <FilterSelect
          className="w-full sm:w-[130px]"
          value={roleFilter}
          onChange={(v) => {
            setRoleFilter(v as UserRole | "all");
            setPage(1);
          }}
          options={[
            { value: "all", label: "All Roles" },
            ...USER_ROLE_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            })),
          ]}
        />

        <FilterSelect
          className="w-full sm:w-[130px]"
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v as UserStatus | "all");
            setPage(1);
          }}
          options={[
            { value: "all", label: "All Status" },
            ...Object.entries(USER_STATUS_CONFIG).map(([value, cfg]) => ({
              value,
              label: cfg.label,
            })),
          ]}
        />

        <FilterField label="Date Created" className="w-full sm:w-[150px]">
          <div className="relative">
            <input
              type="date"
              value={createdDate}
              onChange={(e) => {
                setCreatedDate(e.target.value);
                setPage(1);
              }}
              className={inputClass}
            />
            <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
        </FilterField>
      </div>

      <div className="dashboard-card flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50/95">
              <tr>
                {[
                  "ID",
                  "User",
                  "Role",
                  "Contact",
                  "Status",
                  "Date Created",
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
                    No users found. Click &quot;Add New User&quot; to create one.
                  </td>
                </tr>
              ) : (
                pageItems.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60"
                  >
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {row.userCode}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={row.avatarUrl ?? ""}
                          alt=""
                          className="h-9 w-9 shrink-0 rounded-full bg-gray-100 object-cover"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900">
                            {row.fullName}
                          </p>
                          <p className="truncate text-xs text-gray-500">
                            {row.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <UserRoleBadge role={row.role} />
                    </td>
                    <td className="px-4 py-3 text-gray-800">
                      {formatPhoneDisplay(row.phone)}
                    </td>
                    <td className="px-4 py-3">
                      <UserStatusBadge status={row.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-800">
                      <div>{row.dateLabel}</div>
                      <div className="text-xs text-gray-500">
                        {row.timeLabel}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onView(row)}
                          className="rounded-md p-1.5 text-eco-primary hover:bg-eco-light"
                          aria-label="View user"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEdit(row)}
                          className="rounded-md p-1.5 text-amber-600 hover:bg-amber-50"
                          aria-label="Edit user"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(row)}
                          className="rounded-md p-1.5 text-red-500 hover:bg-red-50"
                          aria-label="Deactivate user"
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

        <div className="flex shrink-0 items-center justify-between border-t border-gray-100 px-4 py-2">
          <p className="text-xs text-gray-500">
            Showing {rangeStart} to {rangeEnd} of {filtered.length} users
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
