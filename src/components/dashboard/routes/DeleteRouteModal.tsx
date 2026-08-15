"use client";

import { useState } from "react";
import { deleteRoute } from "@/app/dashboard/routes/actions";
import type { Route } from "@/types/routes";

type Props = {
  route: Route | null;
  open: boolean;
  onClose: () => void;
  onSuccess: (id: string) => void;
};

export default function DeleteRouteModal({ route, open, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open || !route) return null;

  async function handleDelete() {
    setLoading(true);
    setError(null);
    const result = await deleteRoute(route!.id);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    onSuccess(route!.id);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <h2 className="text-lg font-bold text-gray-900">Delete Route</h2>
        <p className="mt-2 text-sm text-gray-600">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-gray-900">{route.routeCode}</span> (
          {route.name})? This action cannot be undone.
        </p>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
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
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
