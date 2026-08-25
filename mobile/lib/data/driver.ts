import { todayIso } from "../date";
import type { ScheduleItem } from "./schedules";

export type DriverStats = {
  todayTotal: number;
  completed: number;
  pending: number;
  inProgress: number;
};

function namesMatch(scheduleDriver: string | null, driverName: string): boolean {
  if (!scheduleDriver) return true;
  const a = scheduleDriver.toLowerCase();
  const b = driverName.toLowerCase();
  const aFirst = a.split(" ")[0];
  const bFirst = b.split(" ")[0];
  return a.includes(b) || b.includes(a) || aFirst === bFirst;
}

export function filterDriverSchedules(
  schedules: ScheduleItem[],
  driverName: string
): ScheduleItem[] {
  return schedules.filter(
    (s) =>
      s.status !== "no_collection" &&
      s.status !== "maintenance" &&
      namesMatch(s.driver, driverName)
  );
}

export function computeDriverStats(
  schedules: ScheduleItem[],
  date = todayIso()
): DriverStats {
  const today = schedules.filter((s) => s.date === date);
  return {
    todayTotal: today.length,
    completed: today.filter((s) => s.status === "completed").length,
    pending: today.filter((s) => s.status === "pending").length,
    inProgress: today.filter((s) => s.status === "ongoing").length,
  };
}

export function getTodaySchedules(
  schedules: ScheduleItem[],
  driverName: string,
  date = todayIso()
): ScheduleItem[] {
  return filterDriverSchedules(schedules, driverName).filter((s) => s.date === date);
}

export function getActiveSchedule(todaySchedules: ScheduleItem[]): ScheduleItem | null {
  const ongoing = todaySchedules.find((s) => s.status === "ongoing");
  if (ongoing) return ongoing;
  return todaySchedules.find((s) => s.status === "pending") ?? null;
}

export function getCompletedTodaySchedules(todaySchedules: ScheduleItem[]): ScheduleItem[] {
  return todaySchedules.filter((s) => s.status === "completed");
}

export function scheduleMatchesRoute(
  schedule: ScheduleItem,
  route: { barangay: string; area: string }
): boolean {
  const target = schedule.barangay.trim().toLowerCase();
  const areas = route.barangay
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return (
    areas.includes(target) ||
    route.area.trim().toLowerCase() === target ||
    route.barangay.toLowerCase().includes(target)
  );
}

export function computeCollectionProgress(
  schedules: ScheduleItem[],
  date = todayIso()
): { completed: number; total: number; percent: number } {
  const today = schedules.filter(
    (s) => s.date === date && s.status !== "canceled"
  );
  const total = today.length;
  const completed = today.filter((s) => s.status === "completed").length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { completed, total, percent };
}

export function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
