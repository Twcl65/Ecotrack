import { todayIso } from "../date";
import { filterDriverSchedules } from "./driver";
import { fetchSchedules } from "./schedules";
import { supabase } from "../supabase";

export async function startSchedule(scheduleId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("collection_schedules")
    .update({ status: "ongoing", updated_at: new Date().toISOString() })
    .eq("id", scheduleId)
    .in("status", ["pending", "ongoing"])
    .select("id")
    .maybeSingle();
  if (error) return error.message;

  return data ? null : "Collection schedule could not be started.";
}

export async function completeSchedule(scheduleId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("collection_schedules")
    .update({ status: "completed", updated_at: new Date().toISOString() })
    .eq("id", scheduleId)
    .eq("status", "ongoing")
    .select("id")
    .maybeSingle();
  if (error) return error.message;

  return data ? null : "Collection schedule is no longer active.";
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
      s.status === "ongoing"
  );

  for (const schedule of today) {
    const err = await completeSchedule(schedule.id);
    if (err) return err;
  }

  return null;
}
