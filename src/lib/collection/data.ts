import { getBarangays } from "@/lib/barangay/data";
import { getSchedules } from "@/lib/schedules/data";
import { getDriverOptions, getRoutes } from "@/lib/routes/data";
import { createClient } from "@/lib/supabase/server";
import type { CollectionMonitoringData } from "@/types/collection-monitoring";
import type { Schedule } from "@/types/schedules";

async function getRoutesCount(): Promise<number> {
  try {
    const supabase = await createClient();
    const { count, error } = await supabase
      .from("routes")
      .select("*", { count: "exact", head: true })
      .eq("status", "active");

    if (error || count == null) return 0;
    return count;
  } catch {
    return 0;
  }
}

async function getWasteCollectedKg(): Promise<number> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("dashboard_kpis")
      .select("waste_collected_kg")
      .single();

    if (error || !data) return 0;
    return Number(data.waste_collected_kg);
  } catch {
    return 0;
  }
}

function uniqueDrivers(schedules: Schedule[], fromUsers: string[]): string[] {
  const fromDb = schedules
    .map((s) => s.driver)
    .filter((d): d is string => Boolean(d?.trim()));
  return [...new Set([...fromUsers, ...fromDb])].sort((a, b) => a.localeCompare(b));
}

export async function getCollectionMonitoringData(): Promise<CollectionMonitoringData> {
  const [schedules, routes, routesCount, wasteCollectedKg, barangays, driverOptions] =
    await Promise.all([
      getSchedules(),
      getRoutes(),
      getRoutesCount(),
      getWasteCollectedKg(),
      getBarangays(),
      getDriverOptions(),
    ]);

  return {
    schedules,
    routes,
    routesCount,
    wasteCollectedKg,
    barangayOptions: barangays.map((b) => b.name),
    driverOptions: uniqueDrivers(schedules, driverOptions),
  };
}
