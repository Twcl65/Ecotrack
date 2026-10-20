"use client";

import { ChevronDown, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  createAnnouncement,
  updateAnnouncement,
} from "@/app/dashboard/announcement/actions";
import {
  announcementToFormValues,
  defaultFormValues,
} from "@/lib/announcement/format";
import type {
  Announcement,
  AnnouncementFormValues,
  AnnouncementType,
  PublishStatus,
} from "@/types/announcement";
import {
  ANNOUNCEMENT_AUDIENCE_OPTIONS,
  ANNOUNCEMENT_TYPE_OPTIONS,
} from "@/types/announcement";

type Props = {
  mode: "add" | "edit";
  announcement?: Announcement;
  open: boolean;
  onClose: () => void;
  onSuccess: (announcement: Announcement) => void;
};

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white py-2.5 px-3 text-sm outline-none focus:border-eco-primary focus:ring-2 focus:ring-eco-primary/20";

export default function AnnouncementFormModal({
  mode,
  announcement,
  open,
  onClose,
  onSuccess,
}: Props) {
  const [form, setForm] = useState<AnnouncementFormValues>(defaultFormValues());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (mode === "edit" && announcement) {
      setForm(announcementToFormValues(announcement));
    } else {
      setForm(defaultFormValues());
    }
  }, [open, mode, announcement]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result =
      mode === "edit" && announcement
        ? await updateAnnouncement(announcement.id, form)
        : await createAnnouncement(form);

    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }

    if (result.announcement) onSuccess(result.announcement);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-lg font-bold text-gray-900">
            {mode === "add" ? "Add New Announcement" : "Edit Announcement"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          <Field label="Title" required>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Enter announcement title"
              className={inputClass}
            />
          </Field>

          <Field label="Type" required>
            <Select
              value={form.type}
              onChange={(v) =>
                setForm((f) => ({ ...f, type: v as AnnouncementType }))
              }
              options={ANNOUNCEMENT_TYPE_OPTIONS.map((o) => ({
                value: o.value,
                label: o.label,
              }))}
              placeholder="Select type"
            />
          </Field>

          <Field label="Audience" required>
            <Select
              value={form.audience}
              onChange={(v) =>
                setForm((f) => ({
                  ...f,
                  audience: v as AnnouncementFormValues["audience"],
                }))
              }
              options={ANNOUNCEMENT_AUDIENCE_OPTIONS.map((o) => ({
                value: o.value,
                label: o.label,
              }))}
              placeholder="Select audience"
            />
          </Field>

          <Field label="Message" required>
            <textarea
              required
              rows={4}
              maxLength={1000}
              value={form.message}
              onChange={(e) =>
                setForm((f) => ({ ...f, message: e.target.value }))
              }
              placeholder="Enter announcement message..."
              className={inputClass}
            />
            <p className="mt-1 text-right text-xs text-gray-500">
              {form.message.length} / 1000
            </p>
          </Field>

          <Field label="Schedule (Publish Date & Time)" required>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                required
                value={form.publishDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, publishDate: e.target.value }))
                }
                className={inputClass}
              />
              <input
                type="time"
                required
                value={form.publishTime}
                onChange={(e) =>
                  setForm((f) => ({ ...f, publishTime: e.target.value }))
                }
                className={inputClass}
              />
            </div>
          </Field>

          <Field label="Expiry Date & Time">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={form.expiryDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, expiryDate: e.target.value }))
                }
                className={inputClass}
              />
              <input
                type="time"
                value={form.expiryTime}
                onChange={(e) =>
                  setForm((f) => ({ ...f, expiryTime: e.target.value }))
                }
                className={inputClass}
              />
            </div>
          </Field>

          <Field label="Status" required>
            <div className="flex gap-4">
              {(
                [
                  { value: "scheduled", label: "Scheduled" },
                  { value: "publish_now", label: "Publish Now" },
                ] as const
              ).map(({ value, label }) => (
                <label key={value} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="publishStatus"
                    checked={form.publishStatus === value}
                    onChange={() =>
                      setForm((f) => ({
                        ...f,
                        publishStatus: value as PublishStatus,
                      }))
                    }
                    className="text-eco-primary focus:ring-eco-primary"
                  />
                  {label}
                </label>
              ))}
            </div>
          </Field>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-eco-primary px-4 py-2 text-sm font-medium text-eco-primary hover:bg-eco-light"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-eco-primary px-4 py-2 text-sm font-semibold text-white hover:bg-eco-dark disabled:opacity-60"
            >
              {loading ? "Saving..." : "Save Announcement"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}) {
  return (
    <div className="relative">
      <select
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass} appearance-none pr-8`}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
    </div>
  );
}
