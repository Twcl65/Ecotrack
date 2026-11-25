"use server";

import { revalidatePath } from "next/cache";
import {
  getBarangayOptions,
  getDriverOptions,
} from "@/lib/routes/data";
import { getActiveVehicleOptions } from "@/lib/vehicles/data";
import {
  buildFallbackStops,
  formValuesToRow,
  generateRouteDefaults,
  mapRouteRow,
  mapRouteStopRow,
  primaryBarangayFromList,
  stopsToRows,
} from "@/lib/routes/format";
import { createClient } from "@/lib/supabase/server";
import type { Route, RouteFormValues, RouteStatus } from "@/types/routes";

type ActionResult =
  | { success: true; route?: Route }
  | { success: false; error: string };

function validateForm(values: RouteFormValues, isCreate = false): string | null {
  if (!isCreate) {
    if (!values.routeCode.trim()) return "Route code is required.";
    if (!values.name.trim()) return "Route name is required.";
  }
  if (!values.barangay.trim()) return "Area is required.";
  if (!primaryBarangayFromList(values.barangay)) return "Area is required.";
  if (!values.driverName.trim()) return "Driver is required.";
  const distance = parseFloat(values.distanceKm);
  if (Number.isNaN(distance) || distance < 0) return "Distance must be valid.";
  const minutes = parseInt(values.estimatedMinutes, 10);
  if (Number.isNaN(minutes) || minutes < 0) return "Estimated time must be valid.";
  if (!values.status) return "Status is required.";
  if (values.stops.length < 2) {
    return "Add at least 2 stops on the map (start and end).";
  }
  for (let i = 0; i < values.stops.length; i++) {
    if (!values.stops[i].name.trim()) {
      return `Stop ${i + 1} needs a name.`;
    }
  }
  return null;
}

function normalizeDriver(value: string | null): string {
  return (value ?? "").trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

async function validateVehicleAssignment(
  supabase: Awaited<ReturnType<typeof createClient>>,
  values: RouteFormValues,
  unchangedLegacyVehicle = false
): Promise<string | null> {
  if (!values.vehicleId.trim()) return null;

  const { data: vehicle, error } = await supabase
    .from("vehicles")
    .select("vehicle_code, assigned_driver, status")
    .eq("vehicle_code", values.vehicleId.trim().toUpperCase())
    .maybeSingle();

  if (error) return `Could not verify the selected vehicle: ${error.message}`;
  if (!vehicle) {
    return unchangedLegacyVehicle
      ? null
      : "Select a registered vehicle assigned to this driver.";
  }
  if (vehicle.status !== "active") return "Select an active vehicle.";
  if (normalizeDriver(vehicle.assigned_driver) !== normalizeDriver(values.driverName)) {
    return "The selected vehicle is not assigned to the selected driver.";
  }

  return null;
}

async function fetchRouteById(id: string, index = 0): Promise<Route | null> {
  const supabase = await createClient();
  const { data: row } = await supabase.from("routes").select("*").eq("id", id).single();
  if (!row) return null;

  const { data: stops } = await supabase
    .from("route_stops")
    .select("*")
    .eq("route_id", id)
    .order("stop_order");

  const mappedStops = (stops ?? []).map(mapRouteStopRow);
  const route = mapRouteRow(row, index, mappedStops);
  if (route.stops.length === 0) {
    route.stops = buildFallbackStops(id, row.name, route.area);
  }
  return route;
}

async function saveRouteStops(
  routeId: string,
  values: RouteFormValues
): Promise<string | null> {
  const supabase = await createClient();

  await supabase.from("route_stops").delete().eq("route_id", routeId);

  const rows = stopsToRows(routeId, values.stops);
  const { error } = await supabase.from("route_stops").insert(rows);

  return error?.message ?? null;
}

export async function createRoute(values: RouteFormValues): Promise<ActionResult> {
  const err = validateForm(values, true);
  if (err) return { success: false, error: err };

  const supabase = await createClient();
  const vehicleError = await validateVehicleAssignment(supabase, values);
  if (vehicleError) return { success: false, error: vehicleError };

  const { count } = await supabase
    .from("routes")
    .select("*", { count: "exact", head: true });

  const prepared: RouteFormValues = {
    ...values,
    ...generateRouteDefaults(count ?? 0, values),
  };

  const { data, error } = await supabase
    .from("routes")
    .insert(formValuesToRow(prepared))
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  const stopError = await saveRouteStops(data.id, prepared);
  if (stopError) {
    await supabase.from("routes").delete().eq("id", data.id);
    return { success: false, error: stopError };
  }

  const route = await fetchRouteById(data.id);
  revalidatePath("/dashboard/routes");
  revalidatePath("/dashboard/schedules");
  revalidatePath("/dashboard/collection");
  revalidatePath("/dashboard");
  return { success: true, route: route ?? undefined };
}

export async function updateRoute(
  id: string,
  values: RouteFormValues
): Promise<ActionResult> {
  const err = validateForm(values);
  if (err) return { success: false, error: err };

  const supabase = await createClient();
  const { data: currentRoute, error: currentRouteError } = await supabase
    .from("routes")
    .select("vehicle_id, driver_name")
    .eq("id", id)
    .maybeSingle();
  if (currentRouteError) {
    return { success: false, error: currentRouteError.message };
  }
  if (!currentRoute) {
    return { success: false, error: "Route was not found." };
  }
  const vehicleError = await validateVehicleAssignment(
    supabase,
    values,
    currentRoute.vehicle_id === values.vehicleId &&
      normalizeDriver(currentRoute.driver_name) === normalizeDriver(values.driverName)
  );
  if (vehicleError) return { success: false, error: vehicleError };

  const { error } = await supabase
    .from("routes")
    .update(formValuesToRow(values))
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  const stopError = await saveRouteStops(id, values);
  if (stopError) return { success: false, error: stopError };

  const route = await fetchRouteById(id);
  revalidatePath("/dashboard/routes");
  revalidatePath("/dashboard/schedules");
  revalidatePath("/dashboard/collection");
  revalidatePath("/dashboard");
  return { success: true, route: route ?? undefined };
}

export async function archiveRoute(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("routes")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id)
    .is("archived_at", null);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/routes");
  revalidatePath("/dashboard/schedules");
  revalidatePath("/dashboard/collection");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateRouteStatus(
  id: string,
  status: RouteStatus
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("routes").update({ status }).eq("id", id);

  if (error) return { success: false, error: error.message };

  const route = await fetchRouteById(id);
  revalidatePath("/dashboard/routes");
  return { success: true, route: route ?? undefined };
}

export async function fetchRouteFormOptions(): Promise<{
  driverOptions: string[];
  barangayOptions: string[];
  vehicleOptions: Awaited<ReturnType<typeof getActiveVehicleOptions>>;
}> {
  const [driverOptions, barangayOptions, vehicleOptions] = await Promise.all([
    getDriverOptions(),
    getBarangayOptions(),
    getActiveVehicleOptions(),
  ]);
  return { driverOptions, barangayOptions, vehicleOptions };
}
