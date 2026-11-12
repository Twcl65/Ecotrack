"use server";

import { createClient } from "@/lib/supabase/server";

export type VehicleMaintenanceHistory = {
  id: string;
  routeId: string;
  serviceDate: string;
  description: string;
};

export type VehicleMaintenanceData = {
  routeId: string;
  maintenanceSchedule: string;
  nextMaintenanceDate: string | null;
  history: VehicleMaintenanceHistory[];
};

async function getAdminClient() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("You must be signed in to manage vehicle maintenance.");
  }

  const { data: currentUser, error: roleError } = await supabase
    .from("system_users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (roleError) {
    throw new Error(`Could not verify report access: ${roleError.message}`);
  }
  if (currentUser?.role !== "admin") {
    throw new Error("Only administrators can manage vehicle maintenance.");
  }

  return { supabase, user };
}

export async function getVehicleMaintenanceData(): Promise<VehicleMaintenanceData[]> {
  const { supabase } = await getAdminClient();
  const [{ data: schedules, error: scheduleError }, { data: history, error: historyError }] =
    await Promise.all([
      supabase
        .from("vehicle_maintenance_schedules")
        .select("route_id, maintenance_schedule, next_maintenance_date"),
      supabase
        .from("vehicle_maintenance_history")
        .select("id, route_id, service_date, description")
        .order("service_date", { ascending: false }),
    ]);

  if (scheduleError) {
    throw new Error(`Could not load vehicle maintenance schedules: ${scheduleError.message}`);
  }
  if (historyError) {
    throw new Error(`Could not load vehicle maintenance history: ${historyError.message}`);
  }

  const byRoute = new Map<string, VehicleMaintenanceData>();
  for (const row of schedules ?? []) {
    byRoute.set(row.route_id, {
      routeId: row.route_id,
      maintenanceSchedule: row.maintenance_schedule,
      nextMaintenanceDate: row.next_maintenance_date,
      history: [],
    });
  }
  for (const row of history ?? []) {
    const maintenance = byRoute.get(row.route_id) ?? {
      routeId: row.route_id,
      maintenanceSchedule: "",
      nextMaintenanceDate: null,
      history: [],
    };
    maintenance.history.push({
      id: row.id,
      routeId: row.route_id,
      serviceDate: row.service_date,
      description: row.description,
    });
    byRoute.set(row.route_id, maintenance);
  }

  return [...byRoute.values()];
}

export async function saveVehicleMaintenanceData(input: {
  routeId: string;
  maintenanceSchedule: string;
  nextMaintenanceDate: string;
  serviceDate: string;
  serviceDescription: string;
}): Promise<VehicleMaintenanceData> {
  if (!input.routeId.trim() || !input.maintenanceSchedule.trim()) {
    throw new Error("Enter a vehicle maintenance schedule.");
  }
  if (input.nextMaintenanceDate) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.nextMaintenanceDate)) {
      throw new Error("Enter a valid next maintenance date.");
    }
    const nextDate = new Date(`${input.nextMaintenanceDate}T00:00:00Z`);
    if (
      Number.isNaN(nextDate.getTime()) ||
      nextDate.toISOString().slice(0, 10) !== input.nextMaintenanceDate
    ) {
      throw new Error("Enter a valid next maintenance date.");
    }
  } else if (!input.serviceDate) {
    throw new Error("Enter a next maintenance date or a completed service record.");
  }
  if (input.serviceDate && !/^\d{4}-\d{2}-\d{2}$/.test(input.serviceDate)) {
    throw new Error("Enter a valid service date.");
  }
  if (Boolean(input.serviceDate) !== Boolean(input.serviceDescription.trim())) {
    throw new Error("Enter both a service date and service description for history.");
  }

  const { supabase, user } = await getAdminClient();
  const { error: scheduleError } = await supabase
    .from("vehicle_maintenance_schedules")
    .upsert(
      {
        route_id: input.routeId,
        maintenance_schedule: input.maintenanceSchedule.trim(),
        next_maintenance_date: input.nextMaintenanceDate || null,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "route_id" }
    );

  if (scheduleError) {
    throw new Error(`Could not save maintenance schedule: ${scheduleError.message}`);
  }

  if (input.serviceDate) {
    const { error: historyError } = await supabase
      .from("vehicle_maintenance_history")
      .insert({
        route_id: input.routeId,
        service_date: input.serviceDate,
        description: input.serviceDescription.trim(),
        created_by: user.id,
      });

    if (historyError) {
      throw new Error(`Could not save maintenance history: ${historyError.message}`);
    }
  }

  const allMaintenance = await getVehicleMaintenanceData();
  const saved = allMaintenance.find((maintenance) => maintenance.routeId === input.routeId);
  if (!saved) {
    throw new Error("Maintenance was saved but could not be reloaded.");
  }
  return saved;
}
