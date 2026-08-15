"use client";

import { useState } from "react";
import { Archive, Cloud, Save, Timer } from "lucide-react";
import { saveBackupSettings } from "@/app/dashboard/settings/actions";
import SettingsFieldRow, {
  settingsInputClass,
  settingsSelectClass,
} from "./SettingsFieldRow";
import type { AppSettings, BackupSettingsForm } from "@/types/settings";
import { BACKUP_FREQUENCY_OPTIONS } from "@/types/settings";

type Props = {
  settings: AppSettings;
  onSaved: (settings: AppSettings) => void;
};

function toForm(settings: AppSettings): BackupSettingsForm {
  return {
    autoBackupEnabled: settings.autoBackupEnabled,
    backupFrequency: settings.backupFrequency,
    backupRetentionDays: settings.backupRetentionDays,
  };
}

export default function BackupSettingsPanel({ settings, onSaved }: Props) {
  const [form, setForm] = useState<BackupSettingsForm>(() => toForm(settings));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const result = await saveBackupSettings(form);
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
        <h2 className="text-lg font-bold text-gray-900">Backup Settings</h2>
        <p className="mt-1 text-sm text-gray-500">
          Configure automatic backups and data retention.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <SettingsFieldRow icon={Cloud} label="Automatic Backup">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.autoBackupEnabled}
              onChange={(e) =>
                setForm({ ...form, autoBackupEnabled: e.target.checked })
              }
              className="h-4 w-4 rounded accent-eco-primary"
            />
            Enable scheduled database backups
          </label>
        </SettingsFieldRow>

        <SettingsFieldRow icon={Timer} label="Backup Frequency">
          <select
            value={form.backupFrequency}
            onChange={(e) =>
              setForm({
                ...form,
                backupFrequency: e.target.value as BackupSettingsForm["backupFrequency"],
              })
            }
            className={settingsSelectClass}
          >
            {BACKUP_FREQUENCY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </SettingsFieldRow>

        <SettingsFieldRow icon={Archive} label="Retention Period (days)">
          <input
            type="number"
            min={1}
            value={form.backupRetentionDays}
            onChange={(e) =>
              setForm({
                ...form,
                backupRetentionDays: parseInt(e.target.value, 10) || 1,
              })
            }
            className={settingsInputClass}
          />
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
