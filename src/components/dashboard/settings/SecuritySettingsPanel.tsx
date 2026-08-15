"use client";

import { useState } from "react";
import { KeyRound, Lock, Save, ShieldCheck } from "lucide-react";
import { saveSecuritySettings } from "@/app/dashboard/settings/actions";
import SettingsFieldRow, { settingsInputClass } from "./SettingsFieldRow";
import type { AppSettings, SecuritySettingsForm } from "@/types/settings";

type Props = {
  settings: AppSettings;
  onSaved: (settings: AppSettings) => void;
};

function toForm(settings: AppSettings): SecuritySettingsForm {
  return {
    requireStrongPassword: settings.requireStrongPassword,
    twoFactorEnabled: settings.twoFactorEnabled,
    loginAttemptLimit: settings.loginAttemptLimit,
  };
}

export default function SecuritySettingsPanel({ settings, onSaved }: Props) {
  const [form, setForm] = useState<SecuritySettingsForm>(() => toForm(settings));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const result = await saveSecuritySettings(form);
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
        <h2 className="text-lg font-bold text-gray-900">Security Settings</h2>
        <p className="mt-1 text-sm text-gray-500">
          Manage authentication and access control policies.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <SettingsFieldRow icon={Lock} label="Password Policy">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.requireStrongPassword}
              onChange={(e) =>
                setForm({ ...form, requireStrongPassword: e.target.checked })
              }
              className="h-4 w-4 rounded accent-eco-primary"
            />
            Require strong passwords (8+ chars, mixed case, numbers)
          </label>
        </SettingsFieldRow>

        <SettingsFieldRow icon={ShieldCheck} label="Two-Factor Authentication">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.twoFactorEnabled}
              onChange={(e) =>
                setForm({ ...form, twoFactorEnabled: e.target.checked })
              }
              className="h-4 w-4 rounded accent-eco-primary"
            />
            Require 2FA for administrator accounts
          </label>
        </SettingsFieldRow>

        <SettingsFieldRow icon={KeyRound} label="Login Attempt Limit">
          <input
            type="number"
            min={1}
            value={form.loginAttemptLimit}
            onChange={(e) =>
              setForm({
                ...form,
                loginAttemptLimit: parseInt(e.target.value, 10) || 1,
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
