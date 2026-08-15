import type { AppSettings } from "@/types/settings";
import { DEFAULT_APP_SETTINGS } from "@/types/settings";

export function mapSettingsRow(row: {
  system_name: string;
  system_tagline: string;
  timezone: string;
  date_format: string;
  time_format: string;
  language: string;
  items_per_page: number;
  maintenance_mode: boolean;
  session_timeout_minutes: number;
  enable_audit_log: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  complaint_alerts: boolean;
  schedule_reminders: boolean;
  auto_backup_enabled: boolean;
  backup_frequency: string;
  backup_retention_days: number;
  require_strong_password: boolean;
  two_factor_enabled: boolean;
  login_attempt_limit: number;
  updated_at: string;
}): AppSettings {
  return {
    systemName: row.system_name,
    systemTagline: row.system_tagline,
    timezone: row.timezone,
    dateFormat: row.date_format,
    timeFormat: row.time_format as AppSettings["timeFormat"],
    language: row.language,
    itemsPerPage: row.items_per_page,
    maintenanceMode: row.maintenance_mode,
    sessionTimeoutMinutes: row.session_timeout_minutes,
    enableAuditLog: row.enable_audit_log,
    emailNotifications: row.email_notifications,
    pushNotifications: row.push_notifications,
    complaintAlerts: row.complaint_alerts,
    scheduleReminders: row.schedule_reminders,
    autoBackupEnabled: row.auto_backup_enabled,
    backupFrequency: row.backup_frequency as AppSettings["backupFrequency"],
    backupRetentionDays: row.backup_retention_days,
    requireStrongPassword: row.require_strong_password,
    twoFactorEnabled: row.two_factor_enabled,
    loginAttemptLimit: row.login_attempt_limit,
    updatedAt: row.updated_at,
  };
}

export function generalFormToRow(values: {
  systemName: string;
  systemTagline: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  language: string;
  itemsPerPage: number;
}) {
  return {
    system_name: values.systemName.trim(),
    system_tagline: values.systemTagline.trim(),
    timezone: values.timezone,
    date_format: values.dateFormat,
    time_format: values.timeFormat,
    language: values.language,
    items_per_page: values.itemsPerPage,
  };
}

export function systemFormToRow(values: {
  maintenanceMode: boolean;
  sessionTimeoutMinutes: number;
  enableAuditLog: boolean;
}) {
  return {
    maintenance_mode: values.maintenanceMode,
    session_timeout_minutes: values.sessionTimeoutMinutes,
    enable_audit_log: values.enableAuditLog,
  };
}

export function notificationFormToRow(values: {
  emailNotifications: boolean;
  pushNotifications: boolean;
  complaintAlerts: boolean;
  scheduleReminders: boolean;
}) {
  return {
    email_notifications: values.emailNotifications,
    push_notifications: values.pushNotifications,
    complaint_alerts: values.complaintAlerts,
    schedule_reminders: values.scheduleReminders,
  };
}

export function backupFormToRow(values: {
  autoBackupEnabled: boolean;
  backupFrequency: string;
  backupRetentionDays: number;
}) {
  return {
    auto_backup_enabled: values.autoBackupEnabled,
    backup_frequency: values.backupFrequency,
    backup_retention_days: values.backupRetentionDays,
  };
}

export function securityFormToRow(values: {
  requireStrongPassword: boolean;
  twoFactorEnabled: boolean;
  loginAttemptLimit: number;
}) {
  return {
    require_strong_password: values.requireStrongPassword,
    two_factor_enabled: values.twoFactorEnabled,
    login_attempt_limit: values.loginAttemptLimit,
  };
}

export { DEFAULT_APP_SETTINGS };
