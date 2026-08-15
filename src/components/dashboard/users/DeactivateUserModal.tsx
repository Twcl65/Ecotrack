"use client";

import { UserRoundMinus, X } from "lucide-react";
import { useState } from "react";
import { deactivateSystemUser } from "@/app/dashboard/users/actions";
import type { SystemUser } from "@/types/user";
import { USER_ROLE_CONFIG } from "@/types/user";

type Props = {
  user: SystemUser | null;
  open: boolean;
  onClose: () => void;
  onSuccess: (user: SystemUser) => void;
};

export default function DeactivateUserModal({
  user,
  open,
  onClose,
  onSuccess,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open || !user) return null;

  async function handleDeactivate() {
    setLoading(true);
    setError(null);
    const result = await deactivateSystemUser(user!.id);
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    if (result.user) onSuccess(result.user);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-bold text-gray-900">Deactivate User</h2>
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
          Are you sure you want to deactivate this user?
        </p>
        <p className="mt-1 text-center text-sm text-gray-500">
          The account will be set to inactive and will no longer be able to sign
          in.
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

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDeactivate}
            disabled={loading || user.status === "inactive"}
            className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"
          >
            <UserRoundMinus className="h-4 w-4" />
            {loading ? "Deactivating..." : "Deactivate User"}
          </button>
        </div>
      </div>
    </div>
  );
}
