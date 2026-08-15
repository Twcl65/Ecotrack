"use client";

import { useState } from "react";
import { ClipboardList, Monitor, Save, Timer } from "lucide-react";
import { saveSystemSettings } from "@/app/dashboard/settings/actions";
import SettingsFieldRow, { settingsInputClass } from "./SettingsFieldRow";
import type { AppSettings, SystemSettingsForm } from "@/types/settings";

type Props = {
  settings: AppSettings;
  onSaved: (settings: AppSettings) => void;
};

function toForm(settings: AppSettings): SystemSettingsForm {
  return {
    maintenanceMode: settings.maintenanceMode,
    sessionTimeoutMinutes: settings.sessionTimeoutMinutes,
    enableAuditLog: settings.enableAuditLog,
  };
}

export default function SystemSettingsPanel({ settings, onSaved }: Props) {
  const [form, setForm] = useState<SystemSettingsForm>(() => toForm(settings));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const result = await saveSystemSettings(form);
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    onSaved(result.settings);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  }

  return (
    <div className="dashboard-card p-6">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900">System Settings</h2>
        <p className="mt-1 text-sm text-gray-500">
          Manage system behavior and operational preferences.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <SettingsFieldRow icon={Monitor} label="Maintenance Mode">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.maintenanceMode}
              onChange={(e) =>
                setForm({ ...form, maintenanceMode: e.target.checked })
              }
              className="h-4 w-4 rounded accent-eco-primary"
            />
            Enable maintenance mode (restricts non-admin access)
          </label>
        </SettingsFieldRow>

        <SettingsFieldRow icon={Timer} label="Session Timeout (minutes)">
          <input
            type="number"
            min={1}
            value={form.sessionTimeoutMinutes}
            onChange={(e) =>
              setForm({
                ...form,
                sessionTimeoutMinutes: parseInt(e.target.value, 10) || 1,
              })
            }
            className={settingsInputClass}
          />
        </SettingsFieldRow>

        <SettingsFieldRow icon={ClipboardList} label="Audit Log">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.enableAuditLog}
              onChange={(e) =>
                setForm({ ...form, enableAuditLog: e.target.checked })
              }
              className="h-4 w-4 rounded accent-eco-primary"
            />
            Record admin actions in the audit log
          </label>
        </SettingsFieldRow>

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
