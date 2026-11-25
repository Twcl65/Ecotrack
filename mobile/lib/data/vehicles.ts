import { supabase } from "../supabase";

export type DriverVehicle = {
  id: string;
  vehicleCode: string;
  plateNumber: string;
  vehicleType: string;
  model: string;
  currentOdometerKm: number;
  lastMaintenanceDate: string | null;
  lastMaintenanceOdometerKm: number | null;
  nextMaintenanceDate: string | null;
  nextMaintenanceOdometerKm: number | null;
  maintenanceType: string | null;
};

export type DriverVehicleMaintenanceRequest = {
  id: string;
  requestType: string;
  description: string;
  status: string;
  adminNote: string | null;
  scheduledMaintenanceDate: string | null;
  requestedAt: string;
  updatedAt: string;
};

export const VEHICLE_MAINTENANCE_REQUEST_TYPES = [
  "Routine maintenance",
  "Repair",
  "Oil Change",
  "Safety issue",
  "Other",
] as const;

export async function fetchAssignedVehicle(
  driverName: string
): Promise<DriverVehicle | null> {
  const { data, error } = await supabase
    .from("vehicles")
    .select(
      "id, vehicle_code, plate_number, vehicle_type, model, assigned_driver, current_odometer_km, last_maintenance_date, last_maintenance_odometer_km, next_maintenance_date, next_maintenance_odometer_km, maintenance_type"
    )
    .eq("status", "active")
    .limit(2);

  if (error) {
    throw new Error(`Could not load your assigned vehicle: ${error.message}`);
  }
  const normalize = (value: string | null) =>
    (value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
  const row = (data ?? []).find(
    (vehicle) => normalize(vehicle.assigned_driver) === normalize(driverName)
  );
  const assignedCount = (data ?? []).filter(
    (vehicle) => normalize(vehicle.assigned_driver) === normalize(driverName)
  ).length;
  if (assignedCount > 1) {
    throw new Error("More than one active vehicle is assigned to you. Contact an administrator.");
  }

  if (!row) return null;

  return {
    id: row.id,
    vehicleCode: row.vehicle_code,
    plateNumber: row.plate_number,
    vehicleType: row.vehicle_type,
    model: row.model,
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
  };
}

export async function fetchDriverVehicleMaintenanceRequests(
  vehicleId: string,
  driverId: string
): Promise<DriverVehicleMaintenanceRequest[]> {
  const { data, error } = await supabase
    .from("vehicle_maintenance_requests")
    .select("id, request_type, description, status, admin_note, scheduled_maintenance_date, requested_at, updated_at")
    .eq("vehicle_id", vehicleId)
    .eq("driver_id", driverId)
    .order("requested_at", { ascending: false });

  if (error) {
    throw new Error(`Could not load maintenance requests: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    requestType: row.request_type,
    description: row.description,
    status: row.status,
    adminNote: row.admin_note,
    scheduledMaintenanceDate: row.scheduled_maintenance_date,
    requestedAt: row.requested_at,
    updatedAt: row.updated_at,
  }));
}

export async function fetchDriverVehicleMaintenanceNotifications(
  driverId: string
): Promise<DriverVehicleMaintenanceRequest[]> {
  const { data, error } = await supabase
    .from("vehicle_maintenance_requests")
    .select("id, request_type, description, status, admin_note, scheduled_maintenance_date, requested_at, updated_at")
    .eq("driver_id", driverId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(`Could not load maintenance notifications: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    requestType: row.request_type,
    description: row.description,
    status: row.status,
    adminNote: row.admin_note,
    scheduledMaintenanceDate: row.scheduled_maintenance_date,
    requestedAt: row.requested_at,
    updatedAt: row.updated_at,
  }));
}

export async function submitVehicleMaintenanceRequest(params: {
  vehicleId: string;
  requestType: (typeof VEHICLE_MAINTENANCE_REQUEST_TYPES)[number];
  description: string;
}): Promise<string | null> {
  const description = params.description.trim();
  if (!description) return "Describe the maintenance issue.";
  if (description.length > 2000) return "Description must be 2,000 characters or fewer.";
  if (!VEHICLE_MAINTENANCE_REQUEST_TYPES.includes(params.requestType)) {
    return "Select a valid request type.";
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError) return authError.message;
  if (!user) return "Sign in again before sending a maintenance request.";

  const { error } = await supabase.from("vehicle_maintenance_requests").insert({
    vehicle_id: params.vehicleId,
    driver_id: user.id,
    driver_name: "",
    request_type: params.requestType,
    description,
  });

  return error?.message ?? null;
}
