import { filterDriverSchedules } from "./driver";
import { fetchSchedules } from "./schedules";
import { supabase } from "../supabase";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function startSchedule(scheduleId: string): Promise<string | null> {
  const { error } = await supabase
    .from("collection_schedules")
    .update({ status: "ongoing", updated_at: new Date().toISOString() })
    .eq("id", scheduleId);

  return error?.message ?? null;
}

export async function completeSchedule(scheduleId: string): Promise<string | null> {
  const { error } = await supabase
    .from("collection_schedules")
    .update({ status: "completed", updated_at: new Date().toISOString() })
    .eq("id", scheduleId);

  return error?.message ?? null;
}

export async function startTodayCollection(driverName: string): Promise<string | null> {
  const schedules = await fetchSchedules();
  const today = filterDriverSchedules(schedules, driverName).filter(
    (s) => s.date === todayIso() && s.status === "pending"
  );

  for (const schedule of today) {
    const err = await startSchedule(schedule.id);
    if (err) return err;
  }

  return null;
}

export async function completeTodayCollection(driverName: string): Promise<string | null> {
  const schedules = await fetchSchedules();
  const today = filterDriverSchedules(schedules, driverName).filter(
    (s) =>
      s.date === todayIso() &&
      (s.status === "ongoing" || s.status === "pending")
  );

  for (const schedule of today) {
    const err = await completeSchedule(schedule.id);
    if (err) return err;
  }

  return null;
}
