"use client";

import { Calendar, ChevronDown, Clock, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  createSchedule,
  fetchScheduleFormOptions,
  updateSchedule,
} from "@/app/dashboard/schedules/actions";
import { scheduleToFormValues } from "@/lib/schedules/format";
import {
  SCHEDULE_STATUS_CONFIG,
  STATUS_OPTIONS,
  type Schedule,
  type ScheduleFormValues,
  type ScheduleRouteOption,
  type ScheduleStatus,
} from "@/types/schedules";

type Props = {
  mode: "add" | "edit";
  schedule?: Schedule;
  open: boolean;
  driverOptions: string[];
  barangayOptions: string[];
  onClose: () => void;
  onSuccess: (schedule: Schedule) => void;
};

const emptyForm: ScheduleFormValues = {
  barangay: "",
  collectionDate: "",
  routeId: "",
  timeStart: "04:00",
  timeEnd: "08:00",
  driver: "",
  status: "pending",
};

function routeCoversBarangay(route: ScheduleRouteOption, barangay: string): boolean {
  const target = barangay.trim().toLowerCase();
  if (!target) return false;
  if (route.area.toLowerCase() === target) return true;
  return route.barangay
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .includes(target);
}

function findRouteForBarangay(
  routes: ScheduleRouteOption[],
  barangay: string
): string {
  return routes.find((r) => routeCoversBarangay(r, barangay))?.id ?? "";
}

export default function ScheduleFormModal({
  mode,
  schedule,
  open,
  driverOptions,
  barangayOptions,
  onClose,
  onSuccess,
}: Props) {
  const [form, setForm] = useState<ScheduleFormValues>(emptyForm);
  const [drivers, setDrivers] = useState<string[]>(driverOptions);
  const [barangays, setBarangays] = useState<string[]>(barangayOptions);
  const [routes, setRoutes] = useState<ScheduleRouteOption[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setOptionsLoading(true);
    fetchScheduleFormOptions()
      .then(({ driverOptions: freshDrivers, barangayOptions: freshBarangays, routeOptions }) => {
        setDrivers(freshDrivers);
        setBarangays(freshBarangays);
        setRoutes(routeOptions);
      })
      .finally(() => setOptionsLoading(false));
    if (mode === "edit" && schedule) {
      setForm(scheduleToFormValues(schedule));
    } else {
      setForm(emptyForm);
    }
  }, [open, mode, schedule]);

  if (!open) return null;

  const driverChoices = [...drivers];
  if (form.driver && !driverChoices.includes(form.driver)) {
    driverChoices.unshift(form.driver);
  }

  const barangayChoices = [...barangays];
  if (form.barangay && !barangayChoices.includes(form.barangay)) {
    barangayChoices.unshift(form.barangay);
  }

  const routeChoices = [...routes];
  if (form.routeId && !routeChoices.some((r) => r.id === form.routeId) && schedule?.routeLabel) {
    routeChoices.unshift({
      id: form.routeId,
      label: schedule.routeLabel,
      barangay: schedule.barangay,
      area: schedule.barangay,
    });
  }

  const filteredRoutes = form.barangay
    ? routeChoices.filter((r) => routeCoversBarangay(r, form.barangay))
    : routeChoices;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result =
      mode === "edit" && schedule
        ? await updateSchedule(schedule.id, form)
        : await createSchedule(form);

    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    if (result.schedule) onSuccess(result.schedule);
    onClose();
  }

  function setField<K extends keyof ScheduleFormValues>(
    key: K,
    value: ScheduleFormValues[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative z-10 w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-lg font-bold text-gray-900">
            {mode === "add" ? "Add Schedule" : "Edit Schedule"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Barangay">
              <div className="relative">
                <select
                  required
                  disabled={
                    optionsLoading ||
                    barangayChoices.filter((b) => b !== "Maintenance").length === 0
                  }
                  value={form.barangay}
                  onChange={(e) => {
                    const barangay = e.target.value;
                    const matchedRoute = findRouteForBarangay(routes, barangay);
                    setForm((prev) => ({
                      ...prev,
                      barangay,
                      routeId: matchedRoute || prev.routeId,
                    }));
                  }}
                  className={selectClass}
                >
                  <option value="">
                    {optionsLoading ? "Loading barangays..." : "Select Barangay"}
                  </option>
                  {barangayChoices.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
              {!optionsLoading && barangayChoices.filter((b) => b !== "Maintenance").length === 0 && (
                <p className="mt-1 text-xs text-amber-600">
                  No barangays in the database. Add barangays under Barangay Management or run{" "}
                  <code className="text-xs">npm run seed</code>.
                </p>
              )}
            </Field>

            <Field label="Route">
              <div className="relative">
                <select
                  required={form.barangay !== "Maintenance"}
                  disabled={optionsLoading || routeChoices.length === 0}
                  value={form.routeId}
                  onChange={(e) => setField("routeId", e.target.value)}
                  className={selectClass}
                >
                  <option value="">
                    {optionsLoading ? "Loading routes..." : "Select Route"}
                  </option>
                  {(filteredRoutes.length > 0 ? filteredRoutes : routeChoices).map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
              {!optionsLoading && routeChoices.length === 0 && (
                <p className="mt-1 text-xs text-amber-600">
                  No routes found. Add a route under Route Management first.
                </p>
              )}
            </Field>

            <Field label="Collection Date">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  required
                  value={form.collectionDate}
                  onChange={(e) => setField("collectionDate", e.target.value)}
                  className={`${inputClass} pl-9`}
                />
              </div>
            </Field>

            <Field label="Collection Time">
              <div className="relative">
                <Clock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="time"
                  value={form.timeStart}
                  onChange={(e) => setField("timeStart", e.target.value)}
                  className={inputClass}
                />
              </div>
            </Field>

            <Field label="Collection Time">
              <div className="relative">
                <Clock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="time"
                  value={form.timeEnd}
                  onChange={(e) => setField("timeEnd", e.target.value)}
                  className={inputClass}
                />
              </div>
            </Field>

            <Field label="Assign Driver">
              <div className="relative">
                <select
                  value={form.driver}
                  onChange={(e) => setField("driver", e.target.value)}
                  className={selectClass}
                >
                  <option value="">Select Driver</option>
                  {driverChoices.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </Field>

            <Field label="Status">
              <div className="relative">
                <select
                  required
                  value={form.status}
                  onChange={(e) =>
                    setField("status", e.target.value as ScheduleStatus)
                  }
                  className={`${selectClass} pl-8`}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {SCHEDULE_STATUS_CONFIG[s].label}
                    </option>
                  ))}
                </select>
                <span
                  className="absolute left-3 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full"
                  style={{
                    backgroundColor: SCHEDULE_STATUS_CONFIG[form.status].dotColor,
                  }}
                />
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </Field>
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
              type="submit"
              disabled={loading}
              className="rounded-lg bg-eco-primary px-4 py-2 text-sm font-semibold text-white hover:bg-eco-dark disabled:opacity-60"
            >
              {loading
                ? "Saving..."
                : mode === "add"
                  ? "Save Schedule"
                  : "Update Schedule"}
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

const selectClass =
  "w-full appearance-none rounded-lg border border-gray-200 bg-white py-2.5 px-3 text-sm outline-none focus:border-eco-primary focus:ring-2 focus:ring-eco-primary/20";
