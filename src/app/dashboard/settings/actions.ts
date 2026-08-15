"use server";

import { revalidatePath } from "next/cache";
import { getAppSettings } from "@/lib/settings/data";
import {
  backupFormToRow,
  generalFormToRow,
  mapSettingsRow,
  notificationFormToRow,
  securityFormToRow,
  systemFormToRow,
} from "@/lib/settings/format";
import { createClient } from "@/lib/supabase/server";
import type {
  AppSettings,
  BackupSettingsForm,
  GeneralSettingsForm,
  NotificationSettingsForm,
  SecuritySettingsForm,
  SystemSettingsForm,
} from "@/types/settings";

type ActionResult =
  | { success: true; settings: AppSettings }
  | { success: false; error: string };

async function upsertSettings(
  patch: Record<string, unknown>
): Promise<ActionResult> {
  const supabase = await createClient();
  const payload = { ...patch, updated_at: new Date().toISOString() };

  const { data: existing } = await supabase
    .from("app_settings")
    .select("id")
    .eq("id", 1)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from("app_settings")
      .update(payload)
      .eq("id", 1)
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    revalidatePath("/dashboard/settings");
    return { success: true, settings: mapSettingsRow(data) };
  }

  const { data, error } = await supabase
    .from("app_settings")
    .insert({
      id: 1,
      system_name: "ECOTRACK",
      system_tagline: "Cleaner Jasaan, Greener Tomorrow",
      timezone: "Asia/Manila",
      date_format: "MM/DD/YYYY",
      time_format: "24h",
      language: "English",
      items_per_page: 10,
      maintenance_mode: false,
      session_timeout_minutes: 30,
      enable_audit_log: true,
      email_notifications: true,
      push_notifications: true,
      complaint_alerts: true,
      schedule_reminders: true,
      auto_backup_enabled: true,
      backup_frequency: "daily",
      backup_retention_days: 30,
      require_strong_password: true,
      two_factor_enabled: false,
      login_attempt_limit: 5,
      ...payload,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/settings");
  return { success: true, settings: mapSettingsRow(data) };
}

function validateGeneral(values: GeneralSettingsForm): string | null {
  if (!values.systemName.trim()) return "System name is required.";
  if (!values.systemTagline.trim()) return "System tagline is required.";
  if (!values.timezone) return "Time zone is required.";
  if (!values.dateFormat) return "Date format is required.";
  if (!values.language) return "Language is required.";
  if (values.itemsPerPage < 1) return "Items per page must be at least 1.";
  return null;
}

export async function saveGeneralSettings(
  values: GeneralSettingsForm
): Promise<ActionResult> {
  const err = validateGeneral(values);
  if (err) return { success: false, error: err };
  return upsertSettings(generalFormToRow(values));
}

export async function saveSystemSettings(
  values: SystemSettingsForm
): Promise<ActionResult> {
  if (values.sessionTimeoutMinutes < 1) {
    return { success: false, error: "Session timeout must be at least 1 minute." };
  }
  return upsertSettings(systemFormToRow(values));
}

export async function saveNotificationSettings(
  values: NotificationSettingsForm
): Promise<ActionResult> {
  return upsertSettings(notificationFormToRow(values));
}

export async function saveBackupSettings(
  values: BackupSettingsForm
): Promise<ActionResult> {
  if (values.backupRetentionDays < 1) {
    return { success: false, error: "Backup retention must be at least 1 day." };
  }
  return upsertSettings(backupFormToRow(values));
}

export async function saveSecuritySettings(
  values: SecuritySettingsForm
): Promise<ActionResult> {
  if (values.loginAttemptLimit < 1) {
    return { success: false, error: "Login attempt limit must be at least 1." };
  }
  return upsertSettings(securityFormToRow(values));
}

export async function loadAppSettings(): Promise<AppSettings> {
  return getAppSettings();
}
