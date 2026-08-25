"use server";

import { revalidatePath } from "next/cache";
import { getDriverOptions, getRoutes } from "@/lib/routes/data";
import { getScheduleBarangayOptions, getScheduleRouteOptions } from "@/lib/schedules/data";
import { createClient } from "@/lib/supabase/server";
import { mapScheduleRow, toDbTime } from "@/lib/schedules/format";
import type { Schedule, ScheduleFormValues, ScheduleRouteOption, ScheduleStatus } from "@/types/schedules";

type ActionResult =
  | { success: true; schedule?: Schedule }
  | { success: false; error: string };

function validateForm(values: ScheduleFormValues): string | null {
  if (!values.barangay) return "Barangay is required.";
  if (!values.collectionDate) return "Collection date is required.";
  if (!values.status) return "Status is required.";
  if (values.barangay !== "Maintenance" && !values.driver) {
    return "Driver is required.";
  }
  if (values.barangay !== "Maintenance" && (!values.timeStart || !values.timeEnd)) {
    return "Collection time is required.";
  }
  if (
    values.barangay !== "Maintenance" &&
    values.status !== "no_collection" &&
    !values.routeId
  ) {
    return "Route is required.";
  }
  return null;
}

function toInsertRow(values: ScheduleFormValues) {
  const isMaintenance =
    values.barangay === "Maintenance" || values.status === "no_collection";

  return {
    barangay: values.barangay,
    collection_date: values.collectionDate,
    route_id: isMaintenance || !values.routeId ? null : values.routeId,
    time_start: isMaintenance ? null : toDbTime(values.timeStart),
    time_end: isMaintenance ? null : toDbTime(values.timeEnd),
    driver: isMaintenance ? null : values.driver || null,
    status: values.status as ScheduleStatus,
  };
}

async function mapSavedSchedule(row: {
  id: string;
  barangay: string;
  collection_date: string;
  route_id?: string | null;
  time_start: string | null;
  time_end: string | null;
  driver: string | null;
  status: string;
}): Promise<Schedule> {
  if (!row.route_id) return mapScheduleRow(row);
  const routes = await getRoutes();
  const route = routes.find((r) => r.id === row.route_id);
  return mapScheduleRow(row, route);
}

export async function createSchedule(
  values: ScheduleFormValues
): Promise<ActionResult> {
  const validationError = validateForm(values);
  if (validationError) return { success: false, error: validationError };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("collection_schedules")
    .insert(toInsertRow(values))
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/schedules");
  revalidatePath("/dashboard");
  return { success: true, schedule: await mapSavedSchedule(data) };
}

export async function updateSchedule(
  id: string,
  values: ScheduleFormValues
): Promise<ActionResult> {
  const validationError = validateForm(values);
  if (validationError) return { success: false, error: validationError };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("collection_schedules")
    .update({ ...toInsertRow(values), updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/schedules");
  revalidatePath("/dashboard");
  return { success: true, schedule: await mapSavedSchedule(data) };
}

export async function deleteSchedule(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("collection_schedules")
    .delete()
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/schedules");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function fetchDriverOptions(): Promise<string[]> {
  return getDriverOptions();
}

export async function fetchScheduleFormOptions(): Promise<{
  driverOptions: string[];
  barangayOptions: string[];
  routeOptions: ScheduleRouteOption[];
}> {
  const [driverOptions, barangayOptions, routeOptions] = await Promise.all([
    getDriverOptions(),
    getScheduleBarangayOptions(),
    getScheduleRouteOptions(),
  ]);
  return { driverOptions, barangayOptions, routeOptions };
}
