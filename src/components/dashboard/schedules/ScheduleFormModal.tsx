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
  barangay: [],
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
  barangays: string[]
): string {
  if (barangays.length === 0 || barangays.includes("Maintenance")) return "";
  return routes.find((route) =>
    barangays.every((barangay) => routeCoversBarangay(route, barangay))
  )?.id ?? "";
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
  const [form, setForm] = useState<ScheduleFormValues>(() =>
    mode === "edit" && schedule ? scheduleToFormValues(schedule) : emptyForm
  );
  const [drivers, setDrivers] = useState<string[]>(driverOptions);
  const [barangays, setBarangays] = useState<string[]>(barangayOptions);
  const [routes, setRoutes] = useState<ScheduleRouteOption[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    fetchScheduleFormOptions()
      .then(({ driverOptions: freshDrivers, barangayOptions: freshBarangays, routeOptions }) => {
        if (!active) return;
        setDrivers(freshDrivers);
        setBarangays(freshBarangays);
        setRoutes(routeOptions);
      })
      .catch(() => {
        if (active) setError("Unable to load schedule options. Please try again.");
      })
      .finally(() => {
        if (active) setOptionsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open]);

  if (!open) return null;

  const driverChoices = [...drivers];
  if (form.driver && !driverChoices.includes(form.driver)) {
    driverChoices.unshift(form.driver);
  }

  const barangayChoices = barangays;

  const routeChoices = [...routes];
  if (form.routeId && !routeChoices.some((r) => r.id === form.routeId) && schedule?.routeLabel) {
    routeChoices.unshift({
      id: form.routeId,
      label: schedule.routeLabel,
      barangay: schedule.barangay,
      area: schedule.barangay,
    });
  }

  const filteredRoutes = form.barangay.length > 0 && !form.barangay.includes("Maintenance")
    ? routeChoices.filter((route) =>
        form.barangay.every((barangay) => routeCoversBarangay(route, barangay))
      )
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
              <details className="group relative">
                <summary
                  className={`${selectClass} flex cursor-pointer list-none items-center justify-between ${
                    optionsLoading ? "pointer-events-none opacity-60" : ""
                  }`}
                >
                  <span className="truncate text-left">
                    {optionsLoading
                      ? "Loading barangays..."
                      : form.barangay.length > 0
                        ? form.barangay.join(", ")
                        : "Select Barangays"}
                  </span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-gray-400 transition group-open:rotate-180" />
                </summary>
                <div className="absolute left-0 right-0 z-20 mt-1 max-h-52 overflow-auto rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
                  {barangayChoices.map((barangay) => {
                    const checked = form.barangay.includes(barangay);
                    return (
                      <label
                        key={barangay}
                        className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={optionsLoading}
                          onChange={(event) => {
                            const selected = event.target.checked
                              ? [...form.barangay, barangay]
                              : form.barangay.filter((selected) => selected !== barangay);
                            setForm((prev) => ({
                              ...prev,
                              barangay: selected,
                              routeId: findRouteForBarangay(routes, selected),
                            }));
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-eco-primary focus:ring-eco-primary"
                        />
                        {barangay}
                      </label>
                    );
                  })}
                  {barangayChoices.length === 0 && (
                    <p className="px-2 py-2 text-sm text-gray-500">No barangays available.</p>
                  )}
                </div>
              </details>
              {!optionsLoading && barangayChoices.length === 0 && (
                <p className="mt-1 text-xs text-amber-600">
                  No barangays in the database. Add barangays under Barangay Management or run{" "}
                  <code className="text-xs">npm run seed</code>.
                </p>
              )}
            </Field>

            <Field label="Route">
              <div className="relative">
                <select
                  required={!form.barangay.includes("Maintenance") && form.status !== "no_collection"}
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
              {!optionsLoading &&
                routeChoices.length > 0 &&
                form.barangay.length > 0 &&
                !form.barangay.includes("Maintenance") &&
                filteredRoutes.length === 0 && (
                  <p className="mt-1 text-xs text-amber-600">
                    No route covers all selected barangays. Choose a route manually or update Route Management.
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

            <Field label="Start Collection Time">
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

            <Field label="End Collection Time">
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
