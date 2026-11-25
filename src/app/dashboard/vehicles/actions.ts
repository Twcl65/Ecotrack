"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
  Vehicle,
  VehicleFormValues,
  VehicleStatus,
  VehicleType,
} from "@/types/vehicles";

type ActionResult =
  | { success: true; vehicle: Vehicle }
  | { success: false; error: string };

const VEHICLE_TYPES: VehicleType[] = ["Small Truck", "Large Truck", "Other"];
const VEHICLE_STATUSES: VehicleStatus[] = ["active", "inactive"];

function isDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function validateVehicle(values: VehicleFormValues): string | null {
  if (!values || typeof values !== "object") return "Enter valid vehicle details.";
  if (
    typeof values.vehicleCode !== "string" ||
    typeof values.plateNumber !== "string" ||
    typeof values.model !== "string" ||
    typeof values.assignedDriver !== "string" ||
    typeof values.startingOdometerKm !== "string" ||
    typeof values.currentOdometerKm !== "string" ||
    typeof values.lastMaintenanceDate !== "string" ||
    typeof values.lastMaintenanceOdometerKm !== "string" ||
    typeof values.nextMaintenanceDate !== "string" ||
    typeof values.nextMaintenanceOdometerKm !== "string" ||
    typeof values.maintenanceType !== "string"
  ) {
    return "Enter valid vehicle details.";
  }
  if (!values.vehicleCode.trim()) return "Vehicle ID is required.";
  if (!values.plateNumber.trim()) return "Plate number is required.";
  if (!VEHICLE_TYPES.includes(values.vehicleType)) return "Select a valid vehicle type.";
  if (!values.model.trim()) return "Vehicle model is required.";
  if (!VEHICLE_STATUSES.includes(values.status)) return "Select a valid vehicle status.";

  if (!values.startingOdometerKm.trim() || !values.currentOdometerKm.trim()) {
    return "Enter both odometer readings.";
  }
  const startingOdometer = Number(values.startingOdometerKm);
  const currentOdometer = Number(values.currentOdometerKm);
  if (!Number.isFinite(startingOdometer) || startingOdometer < 0) {
    return "Enter a valid starting odometer reading.";
  }
  if (!Number.isFinite(currentOdometer) || currentOdometer < startingOdometer) {
    return "Current odometer must be at least the starting reading.";
  }
  if (
    values.lastMaintenanceOdometerKm &&
    Number(values.lastMaintenanceOdometerKm) > currentOdometer
  ) {
    return "Last maintenance odometer cannot exceed the current reading.";
  }
  if (values.lastMaintenanceDate && !isDate(values.lastMaintenanceDate)) {
    return "Enter a valid last maintenance date.";
  }
  if (values.nextMaintenanceDate && !isDate(values.nextMaintenanceDate)) {
    return "Enter a valid next maintenance date.";
  }
  for (const [label, value] of [
    ["last", values.lastMaintenanceOdometerKm],
    ["next", values.nextMaintenanceOdometerKm],
  ] as const) {
    if (value && (!Number.isFinite(Number(value)) || Number(value) < 0)) {
      return `Enter a valid ${label} maintenance odometer reading.`;
    }
  }
  if (
    Boolean(values.nextMaintenanceDate || values.nextMaintenanceOdometerKm) !==
    Boolean(values.maintenanceType.trim())
  ) {
    return "Enter a maintenance type and at least one next maintenance target.";
  }

  return null;
}

async function getAdminClient() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("You must be signed in to manage vehicles.");
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

function vehicleFromRow(row: {
  id: string;
  vehicle_code: string;
  plate_number: string;
  vehicle_type: VehicleType;
  model: string;
  assigned_driver: string | null;
  starting_odometer_km: number;
  current_odometer_km: number;
  last_maintenance_date: string | null;
  last_maintenance_odometer_km: number | null;
  next_maintenance_date: string | null;
  next_maintenance_odometer_km: number | null;
  maintenance_type: string | null;
  status: VehicleStatus;
  created_at: string;
  updated_at: string;
}): Vehicle {
  return {
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
  };
}

function vehicleValues(values: VehicleFormValues) {
  return {
    vehicle_code: values.vehicleCode.trim().toUpperCase(),
    plate_number: values.plateNumber.trim().toUpperCase(),
    vehicle_type: values.vehicleType,
    model: values.model.trim(),
    assigned_driver: values.assignedDriver.trim() || null,
    starting_odometer_km: Number(values.startingOdometerKm),
    current_odometer_km: Number(values.currentOdometerKm),
    last_maintenance_date: values.lastMaintenanceDate || null,
    last_maintenance_odometer_km: values.lastMaintenanceOdometerKm
      ? Number(values.lastMaintenanceOdometerKm)
      : null,
    next_maintenance_date: values.nextMaintenanceDate || null,
    next_maintenance_odometer_km: values.nextMaintenanceOdometerKm
      ? Number(values.nextMaintenanceOdometerKm)
      : null,
    maintenance_type: values.maintenanceType.trim() || null,
    status: values.status,
    updated_at: new Date().toISOString(),
  };
}

export async function saveVehicle(
  id: string | null,
  values: VehicleFormValues
): Promise<ActionResult> {
  const validationError = validateVehicle(values);
  if (validationError) return { success: false, error: validationError };

  const supabase = await getAdminClient();
  const payload = vehicleValues(values);
  if (payload.status === "active" && payload.assigned_driver) {
    let activeVehicleQuery = supabase
      .from("vehicles")
      .select("id, assigned_driver")
      .eq("status", "active");
    if (id) activeVehicleQuery = activeVehicleQuery.neq("id", id);
    const { data: activeVehicles, error: assignmentError } =
      await activeVehicleQuery;
    if (assignmentError) {
      return {
        success: false,
        error: `Could not verify driver vehicle assignments: ${assignmentError.message}`,
      };
    }

    const normalizedDriver = payload.assigned_driver
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase();
    if (
      (activeVehicles ?? []).some(
        (vehicle) =>
          vehicle.assigned_driver
            ?.trim()
            .replace(/\s+/g, " ")
            .toLowerCase() === normalizedDriver
      )
    ) {
      return {
        success: false,
        error: "This driver already has an active vehicle. Reassign or deactivate it first.",
      };
    }
  }

  const query = id
    ? supabase.from("vehicles").update(payload).eq("id", id)
    : supabase.from("vehicles").insert(payload);
  const { data, error } = await query.select("*").single();

  if (error) {
    if (error.code === "23505") {
      return {
        success: false,
        error: "Vehicle ID or plate number is already in use.",
      };
    }
    return { success: false, error: `Could not save vehicle: ${error.message}` };
  }

  revalidatePath("/dashboard/vehicles");
  return { success: true, vehicle: vehicleFromRow(data) };
}

export async function updateVehicleMaintenanceRequest(
  requestId: string,
  status: "approved" | "in_progress" | "completed" | "rejected",
  adminNote: string,
  scheduledMaintenanceDate?: string
): Promise<
  | { success: true; vehicle?: Vehicle }
  | { success: false; error: string }
> {
  if (!/^[0-9a-f-]{36}$/i.test(requestId)) {
    return { success: false, error: "Select a valid maintenance request." };
  }
  if (!["approved", "in_progress", "completed", "rejected"].includes(status)) {
    return { success: false, error: "Select a valid request status." };
  }
  if (adminNote.length > 1000) {
    return { success: false, error: "Admin notes must be 1,000 characters or fewer." };
  }
  if (
    status === "approved" &&
    (typeof scheduledMaintenanceDate !== "string" ||
      !isDate(scheduledMaintenanceDate))
  ) {
    return {
      success: false,
      error: "Choose a valid scheduled maintenance date before approving.",
    };
  }
  const approvedMaintenanceDate =
    status === "approved" ? scheduledMaintenanceDate : undefined;

  const supabase = await getAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "You must be signed in to manage requests." };
  }

  const { data, error } = await supabase
    .from("vehicle_maintenance_requests")
    .update({
      status,
      admin_note: adminNote.trim() || null,
      ...(approvedMaintenanceDate
        ? { scheduled_maintenance_date: approvedMaintenanceDate }
        : {}),
      reviewed_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .select("id, vehicle_id")
    .maybeSingle();

  if (error) {
    return {
      success: false,
      error: `Could not update maintenance request: ${error.message}`,
    };
  }
  if (!data) {
    return { success: false, error: "Maintenance request was not found." };
  }

  let updatedVehicle: Vehicle | undefined;
  if (status === "approved" || status === "completed") {
    const { data: vehicleRow, error: vehicleError } = await supabase
      .from("vehicles")
      .select("*")
      .eq("id", data.vehicle_id)
      .single();
    if (vehicleError) {
      return {
        success: false,
        error: `Request was updated, but vehicle details could not be refreshed: ${vehicleError.message}`,
      };
    }
    updatedVehicle = vehicleFromRow(vehicleRow);
  }

  revalidatePath("/dashboard/vehicles");
  return { success: true, vehicle: updatedVehicle };
}
