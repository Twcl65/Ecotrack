export type VehicleType = "Small Truck" | "Large Truck" | "Other";
export type VehicleStatus = "active" | "inactive";

export type Vehicle = {
  id: string;
  vehicleCode: string;
  plateNumber: string;
  vehicleType: VehicleType;
  model: string;
  assignedDriver: string | null;
  startingOdometerKm: number;
  currentOdometerKm: number;
  lastMaintenanceDate: string | null;
  lastMaintenanceOdometerKm: number | null;
  nextMaintenanceDate: string | null;
  nextMaintenanceOdometerKm: number | null;
  maintenanceType: string | null;
  status: VehicleStatus;
  createdAt: string;
  updatedAt: string;
};

export type VehicleOption = {
  id: string;
  vehicleCode: string;
  model: string;
  assignedDriver: string | null;
};

export type VehicleDisplayOption = {
  vehicleCode: string;
  model: string;
  plateNumber: string;
};

export type VehicleMaintenanceRequestStatus =
  | "pending"
  | "approved"
  | "in_progress"
  | "completed"
  | "rejected";

export type VehicleMaintenanceRequest = {
  id: string;
  vehicleId: string;
  vehicleCode: string;
  plateNumber: string;
  driverName: string;
  requestType: string;
  description: string;
  status: VehicleMaintenanceRequestStatus;
  adminNote: string | null;
  scheduledMaintenanceDate: string | null;
  requestedAt: string;
  updatedAt: string;
};

export type VehicleFormValues = {
  vehicleCode: string;
  plateNumber: string;
  vehicleType: VehicleType;
  model: string;
  assignedDriver: string;
  startingOdometerKm: string;
  currentOdometerKm: string;
  lastMaintenanceDate: string;
  lastMaintenanceOdometerKm: string;
  nextMaintenanceDate: string;
  nextMaintenanceOdometerKm: string;
  maintenanceType: string;
  status: VehicleStatus;
};
