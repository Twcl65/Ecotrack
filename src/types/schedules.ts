export type ScheduleStatus =
  | "ongoing"
  | "pending"
  | "completed"
  | "canceled"
  | "no_collection"
  | "maintenance";

export type Schedule = {
  id: string;
  date: string;
  dateLabel: string;
  barangay: string;
  routeId: string | null;
  routeLabel: string | null;
  timeStart: string | null;
  timeEnd: string | null;
  driver: string | null;
  status: ScheduleStatus;
};

export type ScheduleFormValues = {
  barangay: string;
  collectionDate: string;
  routeId: string;
  timeStart: string;
  timeEnd: string;
  driver: string;
  status: ScheduleStatus;
};

export type ScheduleRouteOption = {
  id: string;
  label: string;
  barangay: string;
  area: string;
};

// Legacy fallback — use getScheduleBarangayOptions() from @/lib/schedules/data.
export const BARANGAY_OPTIONS: string[] = [];

// Legacy fallback — prefer getDriverOptions() from system_users.
export const DRIVER_OPTIONS: string[] = [];

export const STATUS_OPTIONS: ScheduleStatus[] = [
  "pending",
  "ongoing",
  "completed",
  "canceled",
  "no_collection",
  "maintenance",
];

export const SCHEDULE_STATUS_CONFIG: Record<
  ScheduleStatus,
  { label: string; className: string; dotColor: string }
> = {
  ongoing: {
    label: "Ongoing",
    className: "bg-emerald-100 text-emerald-800",
    dotColor: "#056636",
  },
  pending: {
    label: "Pending",
    className: "bg-amber-100 text-amber-800",
    dotColor: "#eab308",
  },
  completed: {
    label: "Completed",
    className: "bg-blue-100 text-blue-800",
    dotColor: "#2563eb",
  },
  canceled: {
    label: "Canceled",
    className: "bg-red-100 text-red-800",
    dotColor: "#ef4444",
  },
  no_collection: {
    label: "No Collection",
    className: "bg-gray-100 text-gray-700",
    dotColor: "#9ca3af",
  },
  maintenance: {
    label: "Maintenance",
    className: "bg-lime-100 text-lime-800",
    dotColor: "#84cc16",
  },
};
