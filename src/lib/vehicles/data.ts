import { createClient } from "@/lib/supabase/server";
import type {
  Vehicle,
  VehicleDisplayOption,
  VehicleMaintenanceRequest,
  VehicleOption,
} from "@/types/vehicles";

async function getAdminClient() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("You must be signed in to view vehicles.");
  }

  const { data: currentUser, error: roleError } = await supabase
    .from("system_users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (roleError) {
    throw new Error(`Could not verify vehicle access: ${roleError.message}`);
  }
  if (currentUser?.role !== "admin") {
    throw new Error("Only administrators can manage vehicles.");
  }

  return supabase;
}

export async function getVehicles(): Promise<Vehicle[]> {
  const supabase = await getAdminClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Could not load vehicles: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    vehicleCode: row.vehicle_code,
    plateNumber: row.plate_number,
    vehicleType: row.vehicle_type,
    model: row.model,
    assignedDriver: row.assigned_driver,
    startingOdometerKm: Number(row.starting_odometer_km),
    currentOdometerKm: Number(row.current_odometer_km),
    lastMaintenanceDate: row.last_maintenance_date,
    lastMaintenanceOdometerKm:
      row.last_maintenance_odometer_km === null
        ? null
        : Number(row.last_maintenance_odometer_km),
    nextMaintenanceDate: row.next_maintenance_date,
    nextMaintenanceOdometerKm:
      row.next_maintenance_odometer_km === null
        ? null
        : Number(row.next_maintenance_odometer_km),
    maintenanceType: row.maintenance_type,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function getActiveVehicleOptions(): Promise<VehicleOption[]> {
  const supabase = await getAdminClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select("id, vehicle_code, model, assigned_driver")
    .eq("status", "active")
    .order("vehicle_code");

  if (error) {
    throw new Error(`Could not load active vehicles: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    vehicleCode: row.vehicle_code,
    model: row.model,
    assignedDriver: row.assigned_driver,
  }));
}

export async function getVehicleDisplayOptions(): Promise<VehicleDisplayOption[]> {
  const supabase = await getAdminClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select("vehicle_code, model, plate_number")
    .order("vehicle_code");

  if (error) {
    throw new Error(`Could not load vehicle details for routes: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    vehicleCode: row.vehicle_code,
    model: row.model,
    plateNumber: row.plate_number,
  }));
}

export async function getVehicleMaintenanceRequests(): Promise<
  VehicleMaintenanceRequest[]
> {
  const supabase = await getAdminClient();
  const { data: requests, error } = await supabase
    .from("vehicle_maintenance_requests")
    .select("*")
    .order("requested_at", { ascending: false });

  if (error) {
    throw new Error(`Could not load vehicle maintenance requests: ${error.message}`);
  }

  const vehicleIds = [...new Set((requests ?? []).map((request) => request.vehicle_id))];
  const { data: vehicles, error: vehicleError } = vehicleIds.length
    ? await supabase
        .from("vehicles")
        .select("id, vehicle_code, plate_number")
        .in("id", vehicleIds)
    : { data: [], error: null };

  if (vehicleError) {
    throw new Error(`Could not load vehicles for maintenance requests: ${vehicleError.message}`);
  }

  const vehiclesById = new Map((vehicles ?? []).map((vehicle) => [vehicle.id, vehicle]));
  return (requests ?? []).map((request) => {
    const vehicle = vehiclesById.get(request.vehicle_id);
    return {
      id: request.id,
      vehicleId: request.vehicle_id,
      vehicleCode: vehicle?.vehicle_code ?? "Vehicle unavailable",
      plateNumber: vehicle?.plate_number ?? "",
      driverName: request.driver_name,
      requestType: request.request_type,
      description: request.description,
      status: request.status,
      adminNote: request.admin_note,
      scheduledMaintenanceDate: request.scheduled_maintenance_date,
      requestedAt: request.requested_at,
      updatedAt: request.updated_at,
    };
  });
}
