export type TimeFormat = "12h" | "24h";

export type BackupFrequency = "daily" | "weekly" | "monthly";

export type SettingsTab =
  | "general"
  | "system"
  | "notifications"
  | "backup"
  | "security";

export type AppSettings = {
  systemName: string;
  systemTagline: string;
  timezone: string;
  dateFormat: string;
  timeFormat: TimeFormat;
  language: string;
  itemsPerPage: number;
  maintenanceMode: boolean;
  sessionTimeoutMinutes: number;
  enableAuditLog: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  complaintAlerts: boolean;
  scheduleReminders: boolean;
  autoBackupEnabled: boolean;
  backupFrequency: BackupFrequency;
  backupRetentionDays: number;
  requireStrongPassword: boolean;
  twoFactorEnabled: boolean;
  loginAttemptLimit: number;
  updatedAt: string;
};

export type GeneralSettingsForm = Pick<
  AppSettings,
  | "systemName"
  | "systemTagline"
  | "timezone"
  | "dateFormat"
  | "timeFormat"
  | "language"
  | "itemsPerPage"
>;

export type SystemSettingsForm = Pick<
  AppSettings,
  "maintenanceMode" | "sessionTimeoutMinutes" | "enableAuditLog"
>;

export type NotificationSettingsForm = Pick<
  AppSettings,
  | "emailNotifications"
  | "pushNotifications"
  | "complaintAlerts"
  | "scheduleReminders"
>;

export type BackupSettingsForm = Pick<
  AppSettings,
  "autoBackupEnabled" | "backupFrequency" | "backupRetentionDays"
>;

export type SecuritySettingsForm = Pick<
  AppSettings,
  "requireStrongPassword" | "twoFactorEnabled" | "loginAttemptLimit"
>;

export const TIMEZONE_OPTIONS = [
  { value: "Asia/Manila", label: "(GMT+08:00) Asia/Manila" },
  { value: "Asia/Singapore", label: "(GMT+08:00) Asia/Singapore" },
  { value: "Asia/Tokyo", label: "(GMT+09:00) Asia/Tokyo" },
  { value: "UTC", label: "(GMT+00:00) UTC" },
];

export const DATE_FORMAT_OPTIONS = [
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
];

export const LANGUAGE_OPTIONS = [
  { value: "English", label: "English" },
  { value: "Filipino", label: "Filipino" },
];

export const ITEMS_PER_PAGE_OPTIONS = [
  { value: "5", label: "5" },
  { value: "10", label: "10" },
  { value: "20", label: "20" },
  { value: "50", label: "50" },
];

export const BACKUP_FREQUENCY_OPTIONS: { value: BackupFrequency; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export const DEFAULT_APP_SETTINGS: AppSettings = {
  systemName: "ECOTRACK",
  systemTagline: "Cleaner Jasaan, Greener Tomorrow",
  timezone: "Asia/Manila",
  dateFormat: "MM/DD/YYYY",
  timeFormat: "24h",
  language: "English",
  itemsPerPage: 10,
  maintenanceMode: false,
  sessionTimeoutMinutes: 30,
  enableAuditLog: true,
  emailNotifications: true,
  pushNotifications: true,
  complaintAlerts: true,
  scheduleReminders: true,
  autoBackupEnabled: true,
  backupFrequency: "daily",
  backupRetentionDays: 30,
  requireStrongPassword: true,
  twoFactorEnabled: false,
  loginAttemptLimit: 5,
  updatedAt: new Date().toISOString(),
};
