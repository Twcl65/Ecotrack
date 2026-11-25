"use client";

import { useEffect, useState } from "react";
import type { Vehicle, VehicleFormValues, VehicleStatus, VehicleType } from "@/types/vehicles";

type Props = {
  vehicle: Vehicle | null;
  driverOptions: string[];
  onClose: () => void;
  onSave: (values: VehicleFormValues) => Promise<{ success: boolean; error?: string }>;
};

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-eco-primary focus:ring-2 focus:ring-eco-primary/20";

function initialValues(vehicle: Vehicle | null): VehicleFormValues {
  return {
    vehicleCode: vehicle?.vehicleCode ?? "",
    plateNumber: vehicle?.plateNumber ?? "",
    vehicleType: vehicle?.vehicleType ?? "Small Truck",
    model: vehicle?.model ?? "",
    assignedDriver: vehicle?.assignedDriver ?? "",
    startingOdometerKm: String(vehicle?.startingOdometerKm ?? 0),
    currentOdometerKm: String(vehicle?.currentOdometerKm ?? 0),
    lastMaintenanceDate: vehicle?.lastMaintenanceDate ?? "",
    lastMaintenanceOdometerKm:
      vehicle?.lastMaintenanceOdometerKm === null
        ? ""
        : String(vehicle?.lastMaintenanceOdometerKm ?? ""),
    nextMaintenanceDate: vehicle?.nextMaintenanceDate ?? "",
    nextMaintenanceOdometerKm:
      vehicle?.nextMaintenanceOdometerKm === null
        ? ""
        : String(vehicle?.nextMaintenanceOdometerKm ?? ""),
    maintenanceType: vehicle?.maintenanceType ?? "",
    status: vehicle?.status ?? "active",
  };
}

export default function VehicleFormModal({
  vehicle,
  driverOptions,
  onClose,
  onSave,
}: Props) {
  const [form, setForm] = useState(() => initialValues(vehicle));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !saving) onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, saving]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const result = await onSave(form);
      if (!result.success) setError(result.error ?? "Could not save vehicle.");
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Could not save vehicle."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="vehicle-form-title"
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl"
      >
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 id="vehicle-form-title" className="text-lg font-bold text-gray-900">
            {vehicle ? "Edit Vehicle" : "Add Vehicle"}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Enter vehicle details and keep its odometer and maintenance records current.
          </p>
        </div>
        <form onSubmit={submit} className="space-y-4 px-5 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Vehicle ID">
              <input
                required
                value={form.vehicleCode}
                onChange={(event) => setForm({ ...form, vehicleCode: event.target.value })}
                placeholder="VEH-001"
                className={inputClass}
              />
            </Field>
            <Field label="Plate number">
              <input
                required
                value={form.plateNumber}
                onChange={(event) => setForm({ ...form, plateNumber: event.target.value })}
                placeholder="ABC 1234"
                className={inputClass}
              />
            </Field>
            <Field label="Vehicle type">
              <select
                value={form.vehicleType}
                onChange={(event) =>
                  setForm({ ...form, vehicleType: event.target.value as VehicleType })
                }
                className={inputClass}
              >
                <option value="Small Truck">Small Truck (3–5 cu.m.)</option>
                <option value="Large Truck">Large Truck (10–12 cu.m.)</option>
                <option value="Other">Other</option>
              </select>
            </Field>
            <Field label="Vehicle model">
              <input
                required
                value={form.model}
                onChange={(event) => setForm({ ...form, model: event.target.value })}
                placeholder="e.g. Isuzu NLR"
                className={inputClass}
              />
            </Field>
            <Field label="Assigned driver">
              <select
                value={form.assignedDriver}
                onChange={(event) =>
                  setForm({ ...form, assignedDriver: event.target.value })
                }
                className={inputClass}
              >
                <option value="">Unassigned</option>
                {driverOptions.map((driver) => (
                  <option key={driver} value={driver}>
                    {driver}
                  </option>
                ))}
              </select>
              {driverOptions.length === 0 && (
                <span className="mt-1 block text-xs text-gray-500">
                  No active drivers available.
                </span>
              )}
            </Field>
            <Field label="Vehicle status">
              <select
                value={form.status}
                onChange={(event) =>
                  setForm({ ...form, status: event.target.value as VehicleStatus })
                }
                className={inputClass}
              >
                <option value="active">Operational</option>
                <option value="inactive">Inactive</option>
              </select>
            </Field>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-800">Odometer</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Starting odometer (km)">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  required
                  value={form.startingOdometerKm}
                  onChange={(event) =>
                    setForm({ ...form, startingOdometerKm: event.target.value })
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Current odometer (km)">
                <input
                  type="number"
                  min={form.startingOdometerKm || "0"}
                  step="0.1"
                  required
                  value={form.currentOdometerKm}
                  onChange={(event) =>
                    setForm({ ...form, currentOdometerKm: event.target.value })
                  }
                  className={inputClass}
                />
              </Field>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-800">Maintenance</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Last maintenance date">
                <input
                  type="date"
                  value={form.lastMaintenanceDate}
                  onChange={(event) =>
                    setForm({ ...form, lastMaintenanceDate: event.target.value })
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Last maintenance odometer (km)">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={form.lastMaintenanceOdometerKm}
                  onChange={(event) =>
                    setForm({ ...form, lastMaintenanceOdometerKm: event.target.value })
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Next maintenance date">
                <input
                  type="date"
                  value={form.nextMaintenanceDate}
                  onChange={(event) =>
                    setForm({ ...form, nextMaintenanceDate: event.target.value })
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Next maintenance odometer (km)">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={form.nextMaintenanceOdometerKm}
                  onChange={(event) =>
                    setForm({ ...form, nextMaintenanceOdometerKm: event.target.value })
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Maintenance type">
                <input
                  value={form.maintenanceType}
                  onChange={(event) =>
                    setForm({ ...form, maintenanceType: event.target.value })
                  }
                  placeholder="e.g. Oil Change"
                  className={inputClass}
                />
              </Field>
            </div>
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-eco-primary px-4 py-2 text-sm font-semibold text-white hover:bg-eco-dark disabled:opacity-60"
            >
              {saving ? "Saving..." : vehicle ? "Save Changes" : "Add Vehicle"}
            </button>
          </div>
        </form>
      </section>
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
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-gray-700">{label}</span>
      {children}
    </label>
  );
}
