export type BarangayStatus = "active" | "inactive";

export type Barangay = {
  id: string;
  name: string;
  population: number;
  status: BarangayStatus;
  created_at?: string;
  updated_at?: string;
};

export type BarangayFormValues = {
  name: string;
  population: string;
  status: BarangayStatus;
};

export const BARANGAY_STATUS_CONFIG: Record<
  BarangayStatus,
  { label: string; className: string }
> = {
  active: {
    label: "Active",
    className: "bg-emerald-100 text-emerald-800",
  },
  inactive: {
    label: "Inactive",
    className: "bg-gray-100 text-gray-600",
  },
};

export const DEFAULT_BARANGAYS: Barangay[] = [
  { id: "1", name: "Upper Jasaan", population: 2670, status: "active" },
  { id: "2", name: "Nahalinan", population: 1845, status: "active" },
  { id: "3", name: "Lower Jasaan", population: 2230, status: "active" },
  { id: "4", name: "Solana", population: 1980, status: "active" },
  { id: "5", name: "Aplaya", population: 2150, status: "active" },
  { id: "6", name: "Bubontogan", population: 1720, status: "active" },
  { id: "7", name: "San Antonio", population: 2410, status: "active" },
];
