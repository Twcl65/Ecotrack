"use client";

import { Archive, UserRoundMinus, X } from "lucide-react";
import { useState } from "react";
import {
  archiveSystemUser,
  deactivateSystemUser,
} from "@/app/dashboard/users/actions";
import type { SystemUser } from "@/types/user";
import { USER_ROLE_CONFIG } from "@/types/user";

type Props = {
  user: SystemUser | null;
  open: boolean;
  onClose: () => void;
  onDeactivateSuccess: (user: SystemUser) => void;
  onArchiveSuccess: (id: string) => void;
};

export default function DeactivateUserModal({
  user,
  open,
  onClose,
  onDeactivateSuccess,
  onArchiveSuccess,
}: Props) {
  const [loading, setLoading] = useState<"deactivate" | "archive" | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!open || !user) return null;

  async function handleDeactivate() {
    setLoading("deactivate");
    setError(null);
    const result = await deactivateSystemUser(user!.id);
    setLoading(null);

    if (!result.success) {
      setError(result.error);
      return;
    }

    if (result.user) onDeactivateSuccess(result.user);
    onClose();
  }

  async function handleArchive() {
    setLoading("archive");
    setError(null);
    const result = await archiveSystemUser(user!.id);
    setLoading(null);

    if (!result.success) {
      setError(result.error);
      return;
    }

    onArchiveSuccess(user!.id);
    onClose();
  }

  const busy = loading !== null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-bold text-gray-900">Manage User</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-4 text-center text-sm font-semibold text-gray-900">
          What would you like to do with this user?
        </p>
        <p className="mt-1 text-center text-sm text-gray-500">
          Deactivate the account, or archive it to keep its record while
          removing it from active user management.
        </p>

        <div className="mt-4 rounded-lg bg-gray-50 px-3 py-3">
          <p className="font-semibold text-gray-900">{user.fullName}</p>
          <p className="text-xs text-gray-500">{user.email}</p>
          <p className="mt-1 text-xs text-gray-600">
            {USER_ROLE_CONFIG[user.role].label} · {user.userCode}
          </p>
        </div>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDeactivate}
            disabled={busy || user.status === "inactive"}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-500 px-4 py-2 text-sm font-semibold text-amber-600 hover:bg-amber-50 disabled:opacity-60"
          >
            <UserRoundMinus className="h-4 w-4" />
            {loading === "deactivate" ? "Deactivating..." : "Deactivate User"}
          </button>
          <button
            type="button"
            onClick={handleArchive}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
          >
            <Archive className="h-4 w-4" />
            {loading === "archive" ? "Archiving..." : "Archive User"}
          </button>
        </div>
      </div>
    </div>
  );
}
