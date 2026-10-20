import SettingsPageContent from "@/components/dashboard/settings/SettingsPageContent";
import { getAppSettings } from "@/lib/settings/data";

export default async function SettingsPage() {
  const settings = await getAppSettings();

  return <SettingsPageContent initialSettings={settings} />;
}
