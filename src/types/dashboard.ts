export type DashboardKpis = {
  todaysCollection: number;
  totalBarangay: number;
  totalComplaint: number;
  wasteCollectedKg: number;
};

export type CollectionTrendPoint = {
  date: string;
  label: string;
  collections: number;
};

export type CollectionStatusItem = {
  status: "completed" | "in_progress" | "pending" | "cancelled";
  label: string;
  count: number;
  percentage: number;
  color: string;
};

export type WeeklyScheduleItem = {
  id: string;
  day: string;
  date: string;
  barangay: string;
  status: "completed" | "pending";
};

export type Announcement = {
  id: string;
  title: string;
  content: string;
  created_at: string;
};

export type DashboardData = {
  kpis: DashboardKpis;
  collectionTrend: CollectionTrendPoint[];
  collectionStatus: CollectionStatusItem[];
  weeklySchedule: WeeklyScheduleItem[];
  announcements: Announcement[];
};

export const DEFAULT_DASHBOARD_DATA: DashboardData = {
  kpis: {
    todaysCollection: 1,
    totalBarangay: 15,
    totalComplaint: 10,
    wasteCollectedKg: 30670,
  },
  collectionTrend: [
    { date: "2026-07-01", label: "July 1", collections: 8 },
    { date: "2026-07-02", label: "July 2", collections: 12 },
    { date: "2026-07-03", label: "July 3", collections: 6 },
    { date: "2026-07-04", label: "July 4", collections: 15 },
    { date: "2026-07-05", label: "July 5", collections: 10 },
    { date: "2026-07-06", label: "July 6", collections: 18 },
    { date: "2026-07-07", label: "July 7", collections: 14 },
    { date: "2026-07-08", label: "July 8", collections: 9 },
    { date: "2026-07-09", label: "July 9", collections: 20 },
    { date: "2026-07-10", label: "July 10", collections: 16 },
    { date: "2026-07-11", label: "July 11", collections: 11 },
    { date: "2026-07-12", label: "July 12", collections: 7 },
    { date: "2026-07-13", label: "July 13", collections: 13 },
    { date: "2026-07-14", label: "July 14", collections: 19 },
    { date: "2026-07-15", label: "July 15", collections: 22 },
    { date: "2026-07-16", label: "July 16", collections: 17 },
    { date: "2026-07-17", label: "July 17", collections: 12 },
    { date: "2026-07-18", label: "July 18", collections: 8 },
    { date: "2026-07-19", label: "July 19", collections: 14 },
    { date: "2026-07-20", label: "July 20", collections: 21 },
    { date: "2026-07-21", label: "July 21", collections: 16 },
    { date: "2026-07-22", label: "July 22", collections: 10 },
    { date: "2026-07-23", label: "July 23", collections: 18 },
    { date: "2026-07-24", label: "July 24", collections: 15 },
    { date: "2026-07-25", label: "July 25", collections: 11 },
    { date: "2026-07-26", label: "July 26", collections: 9 },
    { date: "2026-07-27", label: "July 27", collections: 13 },
    { date: "2026-07-28", label: "July 28", collections: 17 },
    { date: "2026-07-29", label: "July 29", collections: 20 },
    { date: "2026-07-30", label: "July 30", collections: 14 },
    { date: "2026-07-31", label: "July 31", collections: 12 },
  ],
  collectionStatus: [
    { status: "completed", label: "Completed", count: 12, percentage: 67, color: "#056636" },
    { status: "in_progress", label: "In Progress", count: 3, percentage: 17, color: "#3b82f6" },
    { status: "pending", label: "Pending", count: 2, percentage: 11, color: "#eab308" },
    { status: "cancelled", label: "Cancelled", count: 1, percentage: 5, color: "#ef4444" },
  ],
  weeklySchedule: [
    { id: "1", day: "Mon", date: "July 20", barangay: "Upper Jasaan", status: "completed" },
    { id: "2", day: "Tue", date: "July 21", barangay: "Nahalinan", status: "pending" },
    { id: "3", day: "Wed", date: "July 22", barangay: "Lower Jasaan", status: "pending" },
    { id: "4", day: "Thu", date: "July 23", barangay: "Solana", status: "pending" },
    { id: "5", day: "Fri", date: "July 24", barangay: "Aplaya", status: "pending" },
  ],
  announcements: [
    {
      id: "1",
      title: "Schedule Update",
      content:
        "Collection schedule for July 21, 2026 in Nahalinan will start at 4:00 AM. Please prepare your waste accordingly.",
      created_at: "2026-07-20T08:00:00Z",
    },
    {
      id: "2",
      title: "Clean and Green Reminder",
      content:
        "Let's work together for a cleaner Jasaan! Remember to segregate your waste and support our eco-friendly initiatives.",
      created_at: "2026-07-19T10:00:00Z",
    },
  ],
};
