import { supabase } from "../supabase";

export type DriverLocation = {
  scheduleId: string;
  driverId: string;
  driverName: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  updatedAt: string;
  isTracking: boolean;
};

type DriverLocationRow = {
  schedule_id: string;
  driver_id: string;
  driver_name: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  updated_at: string;
  is_tracking: boolean;
};

function mapLocation(row: DriverLocationRow): DriverLocation {
  return {
    scheduleId: row.schedule_id,
    driverId: row.driver_id,
    driverName: row.driver_name,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    accuracy: row.accuracy === null ? null : Number(row.accuracy),
    updatedAt: row.updated_at,
    isTracking: row.is_tracking,
  };
}

export async function fetchDriverLocation(
  scheduleId: string
): Promise<DriverLocation | null> {
  const { data, error } = await supabase
    .from("driver_locations")
    .select("*")
    .eq("schedule_id", scheduleId)
    .maybeSingle();
  if (error) throw new Error(`Could not load driver location: ${error.message}`);
  return data ? mapLocation(data) : null;
}

export async function publishDriverLocation(params: {
  scheduleId: string;
  driverId: string;
  driverName: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  isTracking: boolean;
}): Promise<string | null> {
  const { error } = await supabase.from("driver_locations").upsert(
    {
      schedule_id: params.scheduleId,
      driver_id: params.driverId,
      driver_name: params.driverName,
      latitude: params.latitude,
      longitude: params.longitude,
      accuracy: params.accuracy,
      updated_at: new Date().toISOString(),
      is_tracking: params.isTracking,
    },
    { onConflict: "schedule_id" }
  );
  return error?.message ?? null;
}

export async function stopDriverLocationTracking(
  scheduleId: string
): Promise<string | null> {
  const { error } = await supabase
    .from("driver_locations")
    .update({ is_tracking: false, updated_at: new Date().toISOString() })
    .eq("schedule_id", scheduleId);
  return error?.message ?? null;
}
