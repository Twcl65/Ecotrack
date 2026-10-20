"use client";

import { useState } from "react";
import {
  Building2,
  Calendar,
  Clock,
  Globe,
  Languages,
  List,
  Save,
  Tag,
} from "lucide-react";
import { saveGeneralSettings } from "@/app/dashboard/settings/actions";
import SettingsFieldRow, {
  settingsInputClass,
  settingsSelectClass,
} from "./SettingsFieldRow";
import type { AppSettings, GeneralSettingsForm } from "@/types/settings";
import {
  DATE_FORMAT_OPTIONS,
  ITEMS_PER_PAGE_OPTIONS,
  LANGUAGE_OPTIONS,
  TIMEZONE_OPTIONS,
} from "@/types/settings";

type Props = {
  settings: AppSettings;
  onSaved: (settings: AppSettings) => void;
};

function toForm(settings: AppSettings): GeneralSettingsForm {
  return {
    systemName: settings.systemName,
    systemTagline: settings.systemTagline,
    timezone: settings.timezone,
    dateFormat: settings.dateFormat,
    timeFormat: settings.timeFormat,
    language: settings.language,
    itemsPerPage: settings.itemsPerPage,
  };
}

export default function GeneralSettingsPanel({ settings, onSaved }: Props) {
  const [form, setForm] = useState<GeneralSettingsForm>(() => toForm(settings));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const result = await saveGeneralSettings(form);
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
        <h2 className="text-lg font-bold text-gray-900">General Settings</h2>
        <p className="mt-1 text-sm text-gray-500">
          Configure the basic information of the system.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <SettingsFieldRow icon={Building2} label="System Name">
          <input
            required
            value={form.systemName}
            onChange={(e) => setForm({ ...form, systemName: e.target.value })}
            className={settingsInputClass}
          />
        </SettingsFieldRow>

        <SettingsFieldRow icon={Tag} label="System Tagline">
          <input
            required
            value={form.systemTagline}
            onChange={(e) => setForm({ ...form, systemTagline: e.target.value })}
            className={settingsInputClass}
          />
        </SettingsFieldRow>

        <SettingsFieldRow icon={Globe} label="Default Time Zone">
          <select
            value={form.timezone}
            onChange={(e) => setForm({ ...form, timezone: e.target.value })}
            className={settingsSelectClass}
          >
            {TIMEZONE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </SettingsFieldRow>

        <SettingsFieldRow icon={Calendar} label="Date Format">
          <select
            value={form.dateFormat}
            onChange={(e) => setForm({ ...form, dateFormat: e.target.value })}
            className={settingsSelectClass}
          >
            {DATE_FORMAT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </SettingsFieldRow>

        <SettingsFieldRow icon={Clock} label="Time Format">
          <div className="flex flex-wrap gap-6 pt-1">
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input
                type="radio"
                name="timeFormat"
                checked={form.timeFormat === "12h"}
                onChange={() => setForm({ ...form, timeFormat: "12h" })}
                className="h-4 w-4 accent-eco-primary"
              />
              12-Hour (AM/PM)
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input
                type="radio"
                name="timeFormat"
                checked={form.timeFormat === "24h"}
                onChange={() => setForm({ ...form, timeFormat: "24h" })}
                className="h-4 w-4 accent-eco-primary"
              />
              24-Hour
            </label>
          </div>
        </SettingsFieldRow>

        <SettingsFieldRow icon={Languages} label="Language">
          <select
            value={form.language}
            onChange={(e) => setForm({ ...form, language: e.target.value })}
            className={settingsSelectClass}
          >
            {LANGUAGE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </SettingsFieldRow>

        <SettingsFieldRow icon={List} label="Items Per Page">
          <select
            value={String(form.itemsPerPage)}
            onChange={(e) =>
              setForm({ ...form, itemsPerPage: parseInt(e.target.value, 10) })
            }
            className={settingsSelectClass}
          >
            {ITEMS_PER_PAGE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
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
