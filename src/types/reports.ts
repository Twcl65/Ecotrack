import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  MapPin,
  Route,
  Truck,
  User,
  Users,
} from "lucide-react";

export type ReportType =
  | "all"
  | "collection"
  | "barangay"
  | "complaint"
  | "driver"
  | "route"
  | "user";

export type ReportFilters = {
  fromDate: string;
  toDate: string;
  reportType: ReportType;
  barangay: string;
};

export type ReportKpis = {
  totalCollections: number;
  totalComplaints: number;
  activeDrivers: number;
  collectionRate: number;
  totalWasteKg: number;
};

export type ReportTrendPoint = {
  date: string;
  label: string;
  collections: number;
};

export type ReportBarangayPoint = {
  barangay: string;
  collections: number;
};

export type ReportStatusSlice = {
  status: "completed" | "in_progress" | "cancelled";
  label: string;
  count: number;
  percentage: number;
  color: string;
};

export type GeneratedReport = {
  id: string;
  reportName: string;
  reportType: ReportType;
  periodLabel: string;
  generatedBy: string;
  generatedAt: string;
  dateLabel: string;
  timeLabel: string;
  fromDate: string;
  toDate: string;
  barangayFilter: string | null;
};

export type ReportAnalytics = {
  kpis: ReportKpis;
  collectionsOverTime: ReportTrendPoint[];
  topBarangays: ReportBarangayPoint[];
  statusBreakdown: ReportStatusSlice[];
};

export type ReportTypeOption = {
  value: ReportType;
  label: string;
  description: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
};

export const REPORT_TYPE_OPTIONS: ReportTypeOption[] = [
  {
    value: "all",
    label: "All Reports",
    description: "All report types",
    icon: Truck,
    iconBg: "bg-gray-100",
    iconColor: "text-gray-600",
  },
  {
    value: "collection",
    label: "Collection Report",
    description: "Summary of waste collection activities",
    icon: Truck,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-700",
  },
  {
    value: "barangay",
    label: "Barangay Collection Report",
    description: "Collection history per barangay",
    icon: MapPin,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-700",
  },
  {
    value: "complaint",
    label: "Complaint Report",
    description: "Summary of resident complaints",
    icon: AlertTriangle,
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
  },
  {
    value: "driver",
    label: "Driver Performance Report",
    description: "Driver performance and collection status",
    icon: User,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-700",
  },
  {
    value: "route",
    label: "Route Report",
    description: "Routes used and collection progress",
    icon: Route,
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
  },
  {
    value: "user",
    label: "User Report",
    description: "Registered users summary",
    icon: Users,
    iconBg: "bg-violet-100",
    iconColor: "text-violet-700",
  },
];

export const REPORT_TYPE_META: Record<
  Exclude<ReportType, "all">,
  { name: string; icon: LucideIcon; iconBg: string; iconColor: string }
> = {
  collection: {
    name: "Collection Report",
    icon: Truck,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-700",
  },
  barangay: {
    name: "Barangay Collection Report",
    icon: MapPin,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-700",
  },
  complaint: {
    name: "Complaint Report",
    icon: AlertTriangle,
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
  },
  driver: {
    name: "Driver Performance Report",
    icon: User,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-700",
  },
  route: {
    name: "Route Report",
    icon: Route,
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
  },
  user: {
    name: "User Report",
    icon: Users,
    iconBg: "bg-violet-100",
    iconColor: "text-violet-700",
  },
};
