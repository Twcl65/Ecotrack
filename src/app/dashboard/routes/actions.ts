"use server";

import { revalidatePath } from "next/cache";
import {
  getBarangayOptions,
  getDriverOptions,
} from "@/lib/routes/data";
import {
  buildFallbackStops,
  formValuesToRow,
  mapRouteRow,
  mapRouteStopRow,
  stopsToRows,
} from "@/lib/routes/format";
import { createClient } from "@/lib/supabase/server";
import type { Route, RouteFormValues, RouteStatus } from "@/types/routes";

type ActionResult =
  | { success: true; route?: Route }
  | { success: false; error: string };

function validateForm(values: RouteFormValues): string | null {
  if (!values.routeCode.trim()) return "Route code is required.";
  if (!values.name.trim()) return "Route name is required.";
  if (!values.barangay.trim()) return "Barangay is required.";
  if (!values.area.trim()) return "Area is required.";
  if (!values.driverName.trim()) return "Driver is required.";
  if (!values.vehicleId.trim()) return "Vehicle ID is required.";
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
  const err = validateForm(values);
  if (err) return { success: false, error: err };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("routes")
    .insert(formValuesToRow(values))
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  const stopError = await saveRouteStops(data.id, values);
  if (stopError) {
    await supabase.from("routes").delete().eq("id", data.id);
    return { success: false, error: stopError };
  }

  const route = await fetchRouteById(data.id);
  revalidatePath("/dashboard/routes");
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
  const { error } = await supabase
    .from("routes")
    .update(formValuesToRow(values))
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  const stopError = await saveRouteStops(id, values);
  if (stopError) return { success: false, error: stopError };

  const route = await fetchRouteById(id);
  revalidatePath("/dashboard/routes");
  revalidatePath("/dashboard/collection");
  revalidatePath("/dashboard");
  return { success: true, route: route ?? undefined };
}

export async function deleteRoute(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("routes").delete().eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/routes");
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
}> {
  const [driverOptions, barangayOptions] = await Promise.all([
    getDriverOptions(),
    getBarangayOptions(),
  ]);
  return { driverOptions, barangayOptions };
}
