import { createClient } from "@/lib/supabase/server";
import { DEFAULT_APP_SETTINGS, mapSettingsRow } from "@/lib/settings/format";
import type { AppSettings } from "@/types/settings";

export async function getAppSettings(): Promise<AppSettings> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("app_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (error || !data) return DEFAULT_APP_SETTINGS;
    return mapSettingsRow(data);
  } catch {
    return DEFAULT_APP_SETTINGS;
  }
}
