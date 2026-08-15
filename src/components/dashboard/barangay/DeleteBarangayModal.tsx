"use client";

import { Trash2, X } from "lucide-react";
import { useState } from "react";
import { deleteBarangay } from "@/app/dashboard/barangay/actions";
import type { Barangay } from "@/types/barangay";

type Props = {
  barangay: Barangay | null;
  open: boolean;
  onClose: () => void;
  onSuccess: (id: string) => void;
};

export default function DeleteBarangayModal({
  barangay,
  open,
  onClose,
  onSuccess,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open || !barangay) return null;

  async function handleDelete() {
    setLoading(true);
    setError(null);
    const result = await deleteBarangay(barangay!.id);
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    onSuccess(barangay!.id);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-bold text-gray-900">Delete Barangay</h2>
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
          Are you sure you want to delete this barangay?
        </p>
        <p className="mt-1 text-sm text-red-500">This action cannot be undone.</p>

        <p className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
          {barangay.name} · {barangay.population.toLocaleString()} residents
        </p>

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
            onClick={handleDelete}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" />
            {loading ? "Deleting..." : "Delete Barangay"}
          </button>
        </div>
      </div>
    </div>
  );
}
