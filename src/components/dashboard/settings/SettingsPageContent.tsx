"use client";

import { useState } from "react";
import {
  Bell,
  Cloud,
  Monitor,
  Settings2,
  Shield,
} from "lucide-react";
import BackupSettingsPanel from "./BackupSettingsPanel";
import GeneralSettingsPanel from "./GeneralSettingsPanel";
import NotificationSettingsPanel from "./NotificationSettingsPanel";
import SecuritySettingsPanel from "./SecuritySettingsPanel";
import SystemSettingsPanel from "./SystemSettingsPanel";
import type { AppSettings, SettingsTab } from "@/types/settings";

type Props = { initialSettings: AppSettings };

const TABS: { id: SettingsTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "general", label: "General", icon: Settings2 },
  { id: "system", label: "System", icon: Monitor },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "backup", label: "Backup", icon: Cloud },
  { id: "security", label: "Security", icon: Shield },
];

export default function SettingsPageContent({ initialSettings }: Props) {
  const [settings, setSettings] = useState(initialSettings);
  const [tab, setTab] = useState<SettingsTab>("general");

  return (
    <div className="settings-page mx-auto max-w-3xl">
      <nav className="mb-4 flex flex-wrap gap-1 border-b border-gray-200">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "border-eco-primary text-eco-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          );
        })}
      </nav>

      {tab === "general" && (
        <GeneralSettingsPanel settings={settings} onSaved={setSettings} />
      )}
      {tab === "system" && (
        <SystemSettingsPanel settings={settings} onSaved={setSettings} />
      )}
      {tab === "notifications" && (
        <NotificationSettingsPanel settings={settings} onSaved={setSettings} />
      )}
      {tab === "backup" && (
        <BackupSettingsPanel settings={settings} onSaved={setSettings} />
      )}
      {tab === "security" && (
        <SecuritySettingsPanel settings={settings} onSaved={setSettings} />
      )}
    </div>
  );
}
