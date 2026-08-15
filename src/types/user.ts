export type UserRole = "admin" | "driver" | "resident";

export type UserStatus = "active" | "inactive";

export type SystemUser = {
  id: string;
  userCode: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  username: string;
  status: UserStatus;
  avatarUrl: string | null;
  lastLoginAt: string | null;
  lastLoginLabel: string | null;
  createdAt: string;
  dateLabel: string;
  timeLabel: string;
  updated_at: string;
};

export type UserFormValues = {
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  phone: string;
  role: UserRole;
  username: string;
  password: string;
  confirmPassword: string;
  status: UserStatus;
};

export type UserStats = {
  total: number;
  administrators: number;
  drivers: number;
  residents: number;
  inactive: number;
};

export const USER_ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "admin", label: "Administrator" },
  { value: "driver", label: "Driver" },
  { value: "resident", label: "Resident" },
];

export const USER_ROLE_CONFIG: Record<
  UserRole,
  { label: string; className: string }
> = {
  admin: {
    label: "Administrator",
    className: "bg-emerald-100 text-emerald-800",
  },
  driver: {
    label: "Driver",
    className: "bg-blue-100 text-blue-800",
  },
  resident: {
    label: "Resident",
    className: "bg-orange-100 text-orange-800",
  },
};

export const USER_STATUS_CONFIG: Record<
  UserStatus,
  { label: string; className: string }
> = {
  active: {
    label: "Active",
    className: "bg-emerald-100 text-emerald-800",
  },
  inactive: {
    label: "Inactive",
    className: "bg-red-100 text-red-800",
  },
};

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: [
    "Manage Users",
    "Manage Schedules",
    "Manage Complaints",
    "Generate Reports",
    "System Settings",
  ],
  driver: [
    "View Schedules",
    "Update Collection Status",
    "View Assigned Routes",
  ],
  resident: [
    "View Collection Schedule",
    "Submit Complaints",
    "View Announcements",
  ],
};
