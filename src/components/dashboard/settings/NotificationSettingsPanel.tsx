"use client";

import { useState } from "react";
import { AlertTriangle, Bell, CalendarClock, Mail, Save } from "lucide-react";
import { saveNotificationSettings } from "@/app/dashboard/settings/actions";
import SettingsFieldRow from "./SettingsFieldRow";
import type { AppSettings, NotificationSettingsForm } from "@/types/settings";

type Props = {
  settings: AppSettings;
  onSaved: (settings: AppSettings) => void;
};

function toForm(settings: AppSettings): NotificationSettingsForm {
  return {
    emailNotifications: settings.emailNotifications,
    pushNotifications: settings.pushNotifications,
    complaintAlerts: settings.complaintAlerts,
    scheduleReminders: settings.scheduleReminders,
  };
}

export default function NotificationSettingsPanel({ settings, onSaved }: Props) {
  const [form, setForm] = useState<NotificationSettingsForm>(() => toForm(settings));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const result = await saveNotificationSettings(form);
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    onSaved(result.settings);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  }

  const toggles = [
    {
      key: "emailNotifications" as const,
      icon: Mail,
      label: "Email Notifications",
      description: "Receive email alerts for important system events",
    },
    {
      key: "pushNotifications" as const,
      icon: Bell,
      label: "Push Notifications",
      description: "Show in-app push notifications",
    },
    {
      key: "complaintAlerts" as const,
      icon: AlertTriangle,
      label: "Complaint Alerts",
      description: "Notify when new complaints are filed",
    },
    {
      key: "scheduleReminders" as const,
      icon: CalendarClock,
      label: "Schedule Reminders",
      description: "Remind admins of upcoming collection schedules",
    },
  ];

  return (
    <div className="dashboard-card p-6">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900">Notification Settings</h2>
        <p className="mt-1 text-sm text-gray-500">
          Control how and when you receive alerts.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {toggles.map(({ key, icon, label, description }) => (
          <SettingsFieldRow key={key} icon={icon} label={label}>
            <label className="inline-flex cursor-pointer items-start gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                className="mt-0.5 h-4 w-4 rounded accent-eco-primary"
              />
              <span>{description}</span>
            </label>
          </SettingsFieldRow>
        ))}

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && (
          <p className="text-sm text-emerald-600">Settings saved successfully.</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-eco-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-eco-dark disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
