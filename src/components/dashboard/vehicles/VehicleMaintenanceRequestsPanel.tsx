"use client";

import { useState } from "react";
import { updateVehicleMaintenanceRequest } from "@/app/dashboard/vehicles/actions";
import type {
  Vehicle,
  VehicleMaintenanceRequest,
  VehicleMaintenanceRequestStatus,
} from "@/types/vehicles";

type Props = {
  initialRequests: VehicleMaintenanceRequest[];
  onVehicleUpdated: (vehicle: Vehicle) => void;
};

const NEXT_STATUSES: Partial<
  Record<
    VehicleMaintenanceRequestStatus,
    { status: "approved" | "in_progress" | "completed" | "rejected"; label: string }[]
  >
> = {
  pending: [
    { status: "approved", label: "Approve" },
    { status: "rejected", label: "Reject" },
  ],
  in_progress: [{ status: "completed", label: "Done" }],
};

function getTodayDateValue() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatMaintenanceDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function VehicleMaintenanceRequestsPanel({
  initialRequests,
  onVehicleUpdated,
}: Props) {
  const [requests, setRequests] = useState(initialRequests);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [maintenanceDates, setMaintenanceDates] = useState<Record<string, string>>({});
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function updateRequest(
    request: VehicleMaintenanceRequest,
    status: "approved" | "in_progress" | "completed" | "rejected",
    scheduledDate?: string
  ) {
    setSavingId(request.id);
    setError("");
    try {
      const result = await updateVehicleMaintenanceRequest(
        request.id,
        status,
        notes[request.id] ?? request.adminNote ?? "",
        status === "approved"
          ? scheduledDate ?? maintenanceDates[request.id]
          : undefined
      );
      if (!result.success) {
        setError(result.error);
        return;
      }
      if (result.vehicle) onVehicleUpdated(result.vehicle);
      setReschedulingId(null);
      setRequests((current) =>
        current.map((item) =>
          item.id === request.id
            ? {
                ...item,
                status,
                adminNote: notes[request.id]?.trim() || null,
                scheduledMaintenanceDate:
                  status === "approved"
                    ? maintenanceDates[request.id]
                    : item.scheduledMaintenanceDate,
                updatedAt: new Date().toISOString(),
              }
            : item
        )
      );
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Could not update maintenance request."
      );
    } finally {
      setSavingId(null);
    }
  }

  return (
    <section className="dashboard-card shrink-0 overflow-hidden">
      <div className="border-b border-gray-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-900">
          Driver Maintenance Requests
        </h3>
        <p className="text-xs text-gray-500">
          Review and respond to maintenance requests submitted from the driver app.
        </p>
      </div>
      {error && (
        <p role="alert" className="px-4 pt-3 text-sm text-red-600">
          {error}
        </p>
      )}
      <div className="divide-y divide-gray-100">
        {requests.map((request) => (
          <article key={request.id} className="space-y-3 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {request.vehicleCode} {request.plateNumber && `· ${request.plateNumber}`}
                </p>
                <p className="text-xs text-gray-500">
                  {request.driverName} · {request.requestType} ·{" "}
                  {formatDate(request.requestedAt)}
                </p>
              </div>
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold capitalize text-amber-800">
                {request.status.replace("_", " ")}
              </span>
            </div>
            <p className="whitespace-pre-wrap text-sm text-gray-700">
              {request.description}
            </p>
            {request.status === "pending" ? (
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-600">
                  Scheduled maintenance date
                </span>
                <input
                  type="date"
                  required
                  value={maintenanceDates[request.id] ?? ""}
                  onChange={(event) =>
                    setMaintenanceDates((current) => ({
                      ...current,
                      [request.id]: event.target.value,
                    }))
                  }
                  disabled={savingId === request.id}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-eco-primary focus:ring-2 focus:ring-eco-primary/20"
                />
              </label>
            ) : request.scheduledMaintenanceDate ? (
              <p className="text-xs font-medium text-gray-700">
                Scheduled maintenance:{" "}
                {formatMaintenanceDate(request.scheduledMaintenanceDate)}
              </p>
            ) : null}
            {request.status === "approved" &&
            request.scheduledMaintenanceDate === getTodayDateValue() ? (
              reschedulingId === request.id ? (
                <div className="flex flex-wrap items-end gap-2">
                  <label className="min-w-[220px] flex-1">
                    <span className="mb-1 block text-xs font-medium text-gray-600">
                      New maintenance date
                    </span>
                    <input
                      type="date"
                      min={getTodayDateValue()}
                      value={maintenanceDates[request.id] ?? ""}
                      onChange={(event) =>
                        setMaintenanceDates((current) => ({
                          ...current,
                          [request.id]: event.target.value,
                        }))
                      }
                      disabled={savingId === request.id}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-eco-primary focus:ring-2 focus:ring-eco-primary/20"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      void updateRequest(
                        request,
                        "approved",
                        maintenanceDates[request.id]
                      )
                    }
                    disabled={
                      savingId === request.id ||
                      !maintenanceDates[request.id] ||
                      maintenanceDates[request.id] ===
                        request.scheduledMaintenanceDate
                    }
                    className="rounded-lg bg-eco-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-eco-dark disabled:opacity-50"
                  >
                    {savingId === request.id ? "Saving..." : "Reschedule"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setReschedulingId(null)}
                    disabled={savingId === request.id}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void updateRequest(request, "completed")}
                    disabled={savingId === request.id}
                    className="rounded-lg bg-eco-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-eco-dark disabled:opacity-50"
                  >
                    {savingId === request.id ? "Saving..." : "Done"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMaintenanceDates((current) => ({
                        ...current,
                        [request.id]: "",
                      }));
                      setReschedulingId(request.id);
                    }}
                    disabled={savingId === request.id}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Reschedule
                  </button>
                </div>
              )
            ) : null}
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-600">
                Admin response / notes
              </span>
              <textarea
                rows={2}
                maxLength={1000}
                readOnly={request.status !== "pending"}
                value={notes[request.id] ?? request.adminNote ?? ""}
                onChange={(event) =>
                  setNotes({ ...notes, [request.id]: event.target.value })
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-eco-primary focus:ring-2 focus:ring-eco-primary/20 read-only:bg-gray-50 read-only:text-gray-600"
              />
            </label>
            {NEXT_STATUSES[request.status]?.length ? (
              <div className="flex flex-wrap gap-2">
                {NEXT_STATUSES[request.status]?.map(({ status, label }) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => void updateRequest(request, status)}
                    disabled={
                      savingId === request.id ||
                      (status === "approved" && !maintenanceDates[request.id])
                    }
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-50 ${
                      status === "rejected"
                        ? "border border-red-200 text-red-700 hover:bg-red-50"
                        : "bg-eco-primary text-white hover:bg-eco-dark"
                    }`}
                  >
                    {savingId === request.id ? "Saving..." : label}
                  </button>
                ))}
              </div>
            ) : null}
          </article>
        ))}
        {requests.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-gray-500">
            No maintenance requests have been submitted.
          </p>
        )}
      </div>
    </section>
  );
}
