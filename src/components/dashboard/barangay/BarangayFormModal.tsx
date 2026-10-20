"use client";

import { ChevronDown, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  createBarangay,
  updateBarangay,
} from "@/app/dashboard/barangay/actions";
import type { Barangay, BarangayFormValues, BarangayStatus } from "@/types/barangay";

type Props = {
  mode: "add" | "edit";
  barangay?: Barangay;
  open: boolean;
  onClose: () => void;
  onSuccess: (barangay: Barangay) => void;
};

const emptyForm: BarangayFormValues = {
  name: "",
  population: "",
  status: "active",
};

export default function BarangayFormModal({
  mode,
  barangay,
  open,
  onClose,
  onSuccess,
}: Props) {
  const [form, setForm] = useState<BarangayFormValues>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (mode === "edit" && barangay) {
      setForm({
        name: barangay.name,
        population: String(barangay.population),
        status: barangay.status,
      });
    } else {
      setForm(emptyForm);
    }
  }, [open, mode, barangay]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result =
      mode === "edit" && barangay
        ? await updateBarangay(barangay.id, form)
        : await createBarangay(form);

    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }

    if (result.barangay) onSuccess(result.barangay);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative z-10 w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-lg font-bold text-gray-900">
            {mode === "add" ? "Add Barangay" : "Edit Barangay Info"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          <Field label="Barangay Name">
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Enter barangay name"
              className={inputClass}
            />
          </Field>

          <Field label="Population">
            <input
              type="number"
              required
              min={0}
              value={form.population}
              onChange={(e) =>
                setForm((f) => ({ ...f, population: e.target.value }))
              }
              placeholder="Enter population"
              className={inputClass}
            />
          </Field>

          <Field label="Status">
            <div className="relative">
              <select
                required
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    status: e.target.value as BarangayStatus,
                  }))
                }
                className={`${inputClass} appearance-none pr-8`}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </Field>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-eco-primary px-4 py-2 text-sm font-semibold text-white hover:bg-eco-dark disabled:opacity-60"
            >
              {loading
                ? "Saving..."
                : mode === "add"
                  ? "Save Barangay"
                  : "Update Barangay"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white py-2.5 px-3 text-sm outline-none focus:border-eco-primary focus:ring-2 focus:ring-eco-primary/20";
