"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronUp, MapPin, Trash2 } from "lucide-react";
import {
  createRoute,
  fetchRouteFormOptions,
  updateRoute,
} from "@/app/dashboard/routes/actions";
import type { Route, RouteFormStop, RouteFormValues, RouteStatus } from "@/types/routes";
import { ROUTE_STATUS_OPTIONS } from "@/types/routes";
import { routeToFormValues } from "@/lib/routes/format";
import {
  defaultStopDescription,
  defaultStopName,
  estimateMinutesFromDistance,
  polylineDistanceKm,
} from "@/lib/routes/geo";

const RouteEditorMap = dynamic(() => import("./RouteEditorMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[280px] items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-500">
      Loading map...
    </div>
  ),
});

type Props = {
  mode: "add" | "edit";
  route?: Route;
  driverOptions: string[];
  barangayOptions: string[];
  open: boolean;
  onClose: () => void;
  onSuccess: (route: Route) => void;
};

const emptyForm = (): RouteFormValues => ({
  routeCode: "",
  name: "",
  barangay: "",
  area: "",
  distanceKm: "",
  estimatedMinutes: "",
  driverName: "",
  vehicleId: "",
  status: "active",
  stops: [],
});

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-eco-primary focus:ring-2 focus:ring-eco-primary/20";

const readOnlyClass =
  "w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700";

function newClientId(): string {
  return `stop-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function parseBarangayList(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function withCurrentChoice(options: string[], current: string): string[] {
  if (!current || options.includes(current)) return options;
  return [current, ...options];
}

export default function RouteFormModal({
  mode,
  route,
  driverOptions,
  barangayOptions,
  open,
  onClose,
  onSuccess,
}: Props) {
  const [form, setForm] = useState<RouteFormValues>(emptyForm());
  const [drivers, setDrivers] = useState<string[]>(driverOptions);
  const [barangays, setBarangays] = useState<string[]>(barangayOptions);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syncDistanceFromStops = useCallback((stops: RouteFormStop[]) => {
    const km = polylineDistanceKm(stops);
    const minutes = estimateMinutesFromDistance(km);
    return {
      distanceKm: km > 0 ? String(km) : "",
      estimatedMinutes: minutes > 0 ? String(minutes) : "",
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    setError(null);
    fetchRouteFormOptions().then(({ driverOptions: freshDrivers, barangayOptions: freshBarangays }) => {
      setDrivers(freshDrivers);
      setBarangays(freshBarangays);
    });

    const initial = route ? routeToFormValues(route) : emptyForm();
    if (initial.stops.length >= 2) {
      Object.assign(initial, syncDistanceFromStops(initial.stops));
    }
    setForm(initial);
  }, [open, route, syncDistanceFromStops]);

  const addStop = useCallback(
    (lat: number, lng: number) => {
      setForm((prev) => {
        const area = prev.area.trim() || "Route Area";
        const order = prev.stops.length + 1;
        const stop: RouteFormStop = {
          clientId: newClientId(),
          name: defaultStopName(order, order, area),
          description: defaultStopDescription(order, order),
          latitude: lat,
          longitude: lng,
        };
        const stops = [...prev.stops, stop];
        return { ...prev, stops, ...syncDistanceFromStops(stops) };
      });
    },
    [syncDistanceFromStops]
  );

  function updateStop(clientId: string, patch: Partial<RouteFormStop>) {
    setForm((prev) => {
      const stops = prev.stops.map((s) =>
        s.clientId === clientId ? { ...s, ...patch } : s
      );
      return { ...prev, stops, ...syncDistanceFromStops(stops) };
    });
  }

  function removeStop(clientId: string) {
    setForm((prev) => {
      const stops = prev.stops.filter((s) => s.clientId !== clientId);
      return { ...prev, stops, ...syncDistanceFromStops(stops) };
    });
  }

  function moveStop(clientId: string, direction: -1 | 1) {
    setForm((prev) => {
      const index = prev.stops.findIndex((s) => s.clientId === clientId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= prev.stops.length) return prev;

      const stops = [...prev.stops];
      [stops[index], stops[target]] = [stops[target], stops[index]];
      return { ...prev, stops, ...syncDistanceFromStops(stops) };
    });
  }

  function toggleBarangay(name: string) {
    setForm((prev) => {
      const selected = parseBarangayList(prev.barangay);
      const next = selected.includes(name)
        ? selected.filter((b) => b !== name)
        : [...selected, name].sort((a, b) => a.localeCompare(b));

      return {
        ...prev,
        barangay: next.join(", "),
        area: next[0] ?? prev.area,
      };
    });
  }

  if (!open) return null;

  const selectedBarangays = parseBarangayList(form.barangay);
  const primaryBarangay = selectedBarangays[0] ?? "";

  const driverChoices = withCurrentChoice(drivers, form.driverName);
  const barangayChoices = [...barangays];
  for (const name of selectedBarangays) {
    if (!barangayChoices.includes(name)) barangayChoices.unshift(name);
  }
  barangayChoices.sort((a, b) => a.localeCompare(b));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result =
      mode === "add"
        ? await createRoute(form)
        : await updateRoute(route!.id, form);

    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    if (result.route) onSuccess(result.route);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative z-10 max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="text-lg font-bold text-gray-900">
            {mode === "add" ? "Add New Route" : "Edit Route"}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Click on the map to place stops. Distance and time are calculated from the route path.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Field label="Route Code">
              <input
                required
                value={form.routeCode}
                onChange={(e) => setForm({ ...form, routeCode: e.target.value })}
                placeholder="R-001"
                className={inputClass}
              />
            </Field>
            <Field label="Status">
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as RouteStatus })
                }
                className={inputClass}
              >
                {ROUTE_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Area">
              <input
                required
                value={form.area}
                onChange={(e) => setForm({ ...form, area: e.target.value })}
                placeholder="Upper Jasaan"
                className={inputClass}
              />
            </Field>
            <Field label="Primary Barangay">
              <select
                required
                value={primaryBarangay}
                onChange={(e) => {
                  const value = e.target.value;
                  if (!value) {
                    setForm((prev) => ({ ...prev, barangay: "", area: prev.area }));
                    return;
                  }
                  const others = selectedBarangays.filter((b) => b !== primaryBarangay);
                  const next = [value, ...others.filter((b) => b !== value)].sort((a, b) =>
                    a.localeCompare(b)
                  );
                  setForm((prev) => ({
                    ...prev,
                    barangay: next.join(", "),
                    area: value,
                  }));
                }}
                className={inputClass}
              >
                <option value="">Select barangay</option>
                {barangayChoices.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {barangayChoices.length > 0 && (
            <Field label="Barangays covered">
              <div className="flex flex-wrap gap-2 rounded-lg border border-gray-100 bg-gray-50/80 p-3">
                {barangayChoices.map((name) => {
                  const checked = selectedBarangays.includes(name);
                  return (
                    <label
                      key={name}
                      className={`flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm ${
                        checked
                          ? "border-eco-primary bg-emerald-50 text-emerald-900"
                          : "border-gray-200 bg-white text-gray-700"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleBarangay(name)}
                        className="rounded border-gray-300 text-eco-primary focus:ring-eco-primary/30"
                      />
                      {name}
                    </label>
                  );
                })}
              </div>
              {selectedBarangays.length > 0 && (
                <p className="mt-1 text-xs text-gray-500">
                  Selected: {form.barangay}
                </p>
              )}
            </Field>
          )}

          {barangayChoices.length === 0 && (
            <p className="text-sm text-amber-600">
              No barangays found. Run <code className="text-xs">supabase/barangay.sql</code> in
              Supabase or add barangays in the dashboard first.
            </p>
          )}

          <Field label="Route Name">
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Route 1 - Upper Jasaan"
              className={inputClass}
            />
          </Field>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-600">
                Route Path & Stops
              </span>
              <span className="text-xs text-gray-400">
                {form.stops.length} stop{form.stops.length === 1 ? "" : "s"}
              </span>
            </div>
            <RouteEditorMap
              stops={form.stops}
              onAddStop={addStop}
              className="h-[280px]"
            />
            <p className="mt-1.5 text-xs text-gray-500">
              Click the map to add each stop in order (1st stop, 2nd stop, Purok 1, Purok 2…).
            </p>
          </div>

          {form.stops.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Route Stops
              </p>
              <ul className="max-h-48 space-y-2 overflow-y-auto pr-1">
                {form.stops.map((stop, index) => (
                  <li
                    key={stop.clientId}
                    className="flex items-start gap-2 rounded-lg border border-gray-100 bg-gray-50/80 p-2.5"
                  >
                    <span className="mt-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <input
                        required
                        value={stop.name}
                        onChange={(e) =>
                          updateStop(stop.clientId, { name: e.target.value })
                        }
                        placeholder={`${index + 1}${index === 0 ? "st" : index === 1 ? "nd" : index === 2 ? "rd" : "th"} Stop`}
                        className={inputClass}
                      />
                      <input
                        value={stop.description}
                        onChange={(e) =>
                          updateStop(stop.clientId, { description: e.target.value })
                        }
                        placeholder="e.g. Residential Area"
                        className={inputClass}
                      />
                    </div>
                    <div className="flex shrink-0 flex-col gap-0.5">
                      <button
                        type="button"
                        onClick={() => moveStop(stop.clientId, -1)}
                        disabled={index === 0}
                        className="rounded p-1 text-gray-400 hover:bg-gray-200 disabled:opacity-30"
                        aria-label="Move stop up"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveStop(stop.clientId, 1)}
                        disabled={index === form.stops.length - 1}
                        className="rounded p-1 text-gray-400 hover:bg-gray-200 disabled:opacity-30"
                        aria-label="Move stop down"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeStop(stop.clientId)}
                        className="rounded p-1 text-red-500 hover:bg-red-50"
                        aria-label="Remove stop"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Field label="Distance (km)">
              <input
                readOnly
                value={form.distanceKm ? `${form.distanceKm} km` : "Add stops to calculate"}
                aria-label="Distance in kilometers (auto-calculated)"
                className={readOnlyClass}
              />
              <p className="mt-0.5 text-xs text-gray-400">Auto-calculated from stops</p>
            </Field>
            <Field label="Est. Time (min)">
              <input
                readOnly
                value={
                  form.estimatedMinutes
                    ? `${form.estimatedMinutes} min`
                    : "Add stops to calculate"
                }
                aria-label="Estimated minutes (auto-calculated)"
                className={readOnlyClass}
              />
              <p className="mt-0.5 text-xs text-gray-400">Auto-calculated from distance</p>
            </Field>
            <Field label="Driver">
              <select
                required
                value={form.driverName}
                onChange={(e) => setForm({ ...form, driverName: e.target.value })}
                className={inputClass}
              >
                <option value="">Select driver</option>
                {driverChoices.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              {driverChoices.length === 0 && (
                <p className="mt-1 text-xs text-amber-600">
                  No drivers found. Add driver accounts in User Management first.
                </p>
              )}
            </Field>
            <Field label="Vehicle ID">
              <input
                required
                value={form.vehicleId}
                onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
                placeholder="VEH-001"
                className={inputClass}
              />
            </Field>
          </div>

          {form.stops.length < 2 && (
            <p className="flex items-center gap-1.5 text-sm text-amber-600">
              <MapPin className="h-4 w-4 shrink-0" />
              Add at least 2 stops on the map to define the route path.
            </p>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || form.stops.length < 2}
              className="rounded-lg bg-eco-primary px-4 py-2 text-sm font-medium text-white hover:bg-eco-dark disabled:opacity-60"
            >
              {loading ? "Saving..." : mode === "add" ? "Add Route" : "Save Changes"}
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
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-600">{label}</span>
      {children}
    </label>
  );
}
