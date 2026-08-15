import { getBarangays } from "@/lib/barangay/data";
import { createClient } from "@/lib/supabase/server";
import { mapScheduleRow } from "@/lib/schedules/format";
import type { Schedule } from "@/types/schedules";

/** Active barangays from DB, plus any used in existing schedules and Maintenance. */
export async function getScheduleBarangayOptions(): Promise<string[]> {
  const [barangays, schedules] = await Promise.all([getBarangays(), getSchedules()]);
  const names = new Set<string>();

  for (const row of barangays) {
    if (row.status === "active") names.add(row.name);
  }
  for (const schedule of schedules) {
    if (schedule.barangay?.trim()) names.add(schedule.barangay.trim());
  }
  names.add("Maintenance");

  return [...names].sort((a, b) => a.localeCompare(b));
}

export async function getSchedules(): Promise<Schedule[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("collection_schedules")
      .select("*")
      .order("collection_date", { ascending: true });

    if (error || !data?.length) return [];
    return data.map(mapScheduleRow);
  } catch {
    return [];
  }
}
