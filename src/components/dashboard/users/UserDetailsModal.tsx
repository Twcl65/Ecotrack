"use client";

import {
  Calendar,
  Check,
  ChevronDown,
  Clock,
  Fingerprint,
  Pencil,
  Shield,
  UserRound,
  UserRoundMinus,
  X,
} from "lucide-react";
import { useState } from "react";
import { updateSystemUserStatus } from "@/app/dashboard/users/actions";
import { formatPhoneDisplay } from "@/lib/users/format";
import {
  UserRolePill,
  UserStatusBadge,
} from "./UserBadges";
import type { SystemUser, UserStatus } from "@/types/user";
import {
  ROLE_PERMISSIONS,
  USER_ROLE_CONFIG,
  USER_STATUS_CONFIG,
} from "@/types/user";

type Props = {
  user: SystemUser | null;
  open: boolean;
  onClose: () => void;
  onEdit: (user: SystemUser) => void;
  onDeactivate: (user: SystemUser) => void;
  onUpdated: (user: SystemUser) => void;
};

export default function UserDetailsModal({
  user,
  open,
  onClose,
  onEdit,
  onDeactivate,
  onUpdated,
}: Props) {
  const [statusLoading, setStatusLoading] = useState(false);

  if (!open || !user) return null;

  async function handleStatusChange(status: UserStatus) {
    if (status === user!.status) return;
    setStatusLoading(true);
    const result = await updateSystemUserStatus(user!.id, status);
    setStatusLoading(false);
    if (result.success && result.user) onUpdated(result.user);
  }

  const permissions = ROLE_PERMISSIONS[user.role];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-lg font-bold text-gray-900">User Details</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 py-4">
          <div className="flex items-start gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={user.avatarUrl ?? ""}
              alt=""
              className="h-16 w-16 shrink-0 rounded-full bg-gray-100 object-cover"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-bold text-gray-900">
                  {user.fullName}
                </h3>
                <UserStatusBadge status={user.status} />
                <UserRolePill role={user.role} />
              </div>
              <p className="mt-1 text-sm text-gray-500">{user.email}</p>
              <p className="text-sm text-gray-500">
                {formatPhoneDisplay(user.phone)}
              </p>
            </div>
          </div>

          <ul className="mt-5 space-y-3 border-t border-gray-100 pt-4">
            <MetaRow
              icon={Fingerprint}
              label="User ID"
              value={user.userCode}
            />
            <MetaRow
              icon={UserRound}
              label="Role"
              value={USER_ROLE_CONFIG[user.role].label}
            />
            <MetaRow
              icon={Calendar}
              label="Date Created"
              value={`${user.dateLabel} at ${user.timeLabel}`}
            />
            <MetaRow
              icon={Clock}
              label="Last Login"
              value={user.lastLoginLabel ?? "Never logged in"}
            />
            <li className="flex items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Shield className="h-4 w-4 text-gray-400" />
                <span>Status</span>
              </div>
              <div className="relative">
                <select
                  value={user.status}
                  disabled={statusLoading}
                  onChange={(e) =>
                    handleStatusChange(e.target.value as UserStatus)
                  }
                  className={`appearance-none rounded-full py-0.5 pl-2.5 pr-7 text-xs font-semibold outline-none ${USER_STATUS_CONFIG[user.status].className}`}
                >
                  {Object.entries(USER_STATUS_CONFIG).map(([value, cfg]) => (
                    <option key={value} value={value}>
                      {cfg.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-500" />
              </div>
            </li>
          </ul>

          <div className="mt-5 border-t border-gray-100 pt-4">
            <p className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
              <Shield className="h-4 w-4 text-eco-primary" />
              Permissions
            </p>
            <ul className="space-y-2">
              {permissions.map((permission) => (
                <li
                  key={permission}
                  className="flex items-center gap-2 text-sm text-gray-700"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <Check className="h-3 w-3" />
                  </span>
                  {permission}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex gap-2 border-t border-gray-100 px-5 py-4">
          <button
            type="button"
            onClick={() => {
              onClose();
              onEdit(user);
            }}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-eco-primary px-4 py-2 text-sm font-semibold text-eco-primary hover:bg-eco-light"
          >
            <Pencil className="h-4 w-4" />
            Edit User
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onDeactivate(user);
            }}
            disabled={user.status === "inactive"}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-500 px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <UserRoundMinus className="h-4 w-4" />
            Deactivate User
          </button>
        </div>
      </div>
    </div>
  );
}

function MetaRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Calendar;
  label: string;
  value: string;
}) {
  return (
    <li className="flex items-center justify-between gap-3 text-sm">
      <div className="flex items-center gap-2 text-gray-600">
        <Icon className="h-4 w-4 text-gray-400" />
        <span>{label}</span>
      </div>
      <span className="text-right font-medium text-gray-900">{value}</span>
    </li>
  );
}
