"use client";

import { ChevronDown, ImagePlus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { updateComplaint } from "@/app/dashboard/complaint/actions";
import ComplaintAttachmentImage from "./ComplaintAttachmentImage";
import { complaintToFormValues } from "@/lib/complaint/format";
import { uploadComplaintImage } from "@/lib/complaint/upload";
import type {
  Complaint,
  ComplaintFormValues,
  ComplaintStatus,
} from "@/types/complaint";
import { COMPLAINT_STATUS_OPTIONS } from "@/types/complaint";

type Props = {
  complaint: Complaint | undefined;
  barangayOptions: string[];
  open: boolean;
  onClose: () => void;
  onSuccess: (complaint: Complaint) => void;
};

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white py-2.5 px-3 text-sm outline-none focus:border-eco-primary focus:ring-2 focus:ring-eco-primary/20";

export default function ComplaintFormModal({
  complaint,
  barangayOptions,
  open,
  onClose,
  onSuccess,
}: Props) {
  const [form, setForm] = useState<ComplaintFormValues>({
    complainantName: "",
    phone: "",
    barangay: "",
    issue: "",
    status: "pending",
    filedDate: "",
    filedTime: "",
    attachmentUrl: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open || !complaint) return;
    setError(null);
    setAttachmentFile(null);
    setForm(complaintToFormValues(complaint));
    setAttachmentPreview(complaint.attachmentUrl);
  }, [open, complaint]);

  useEffect(() => {
    if (!attachmentFile) return;
    const objectUrl = URL.createObjectURL(attachmentFile);
    setAttachmentPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [attachmentFile]);

  if (!open || !complaint) return null;

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }
    setError(null);
    setAttachmentFile(file);
  }

  function clearAttachment() {
    setAttachmentFile(null);
    setAttachmentPreview(null);
    setForm((f) => ({ ...f, attachmentUrl: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let attachmentUrl = form.attachmentUrl.trim();

      if (attachmentFile) {
        attachmentUrl = await uploadComplaintImage(
          attachmentFile,
          complaint!.id
        );
      }

      const result = await updateComplaint(complaint!.id, {
        ...form,
        attachmentUrl,
      });
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    if (result.complaint) onSuccess(result.complaint);
    onClose();
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "Failed to upload image.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-lg font-bold text-gray-900">Edit Complaint Info</h2>
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
          <p className="text-sm font-semibold text-gray-700">
            {complaint.complaintCode}
          </p>

          <Field label="Complainant Name">
            <input
              type="text"
              required
              value={form.complainantName}
              onChange={(e) =>
                setForm((f) => ({ ...f, complainantName: e.target.value }))
              }
              className={inputClass}
            />
          </Field>

          <Field label="Phone">
            <input
              type="tel"
              required
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className={inputClass}
            />
          </Field>

          <Field label="Barangay">
            <div className="relative">
              <select
                required
                value={form.barangay}
                onChange={(e) =>
                  setForm((f) => ({ ...f, barangay: e.target.value }))
                }
                className={`${inputClass} appearance-none pr-8`}
              >
                <option value="">Select Barangay</option>
                {barangayOptions.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </Field>

          <Field label="Issue">
            <textarea
              required
              rows={3}
              value={form.issue}
              onChange={(e) => setForm((f) => ({ ...f, issue: e.target.value }))}
              className={inputClass}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Date Filed">
              <input
                type="date"
                required
                value={form.filedDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, filedDate: e.target.value }))
                }
                className={inputClass}
              />
            </Field>
            <Field label="Time Filed">
              <input
                type="time"
                required
                value={form.filedTime}
                onChange={(e) =>
                  setForm((f) => ({ ...f, filedTime: e.target.value }))
                }
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Status">
            <div className="relative">
              <select
                required
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    status: e.target.value as ComplaintStatus,
                  }))
                }
                className={`${inputClass} appearance-none pr-8`}
              >
                {COMPLAINT_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </Field>

          <Field label="Attachment">
            <div className="flex flex-wrap items-start gap-3">
              <ComplaintAttachmentImage
                src={attachmentPreview}
                className="h-28 w-28 rounded-lg border border-gray-200 object-cover"
                emptyClassName="h-28 w-28 rounded-lg border border-dashed border-gray-300 bg-gray-100"
              />
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <ImagePlus className="h-4 w-4" />
                  {attachmentPreview ? "Change Image" : "Upload Image"}
                </button>
                {attachmentPreview && (
                  <button
                    type="button"
                    onClick={clearAttachment}
                    className="text-left text-xs text-red-500 hover:text-red-600"
                  >
                    Remove image
                  </button>
                )}
                <p className="text-xs text-gray-500">
                  JPG, PNG, WEBP, or GIF up to 5MB
                </p>
              </div>
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
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-eco-primary px-4 py-2 text-sm font-semibold text-white hover:bg-eco-dark disabled:opacity-60"
            >
              {loading ? "Saving..." : "Update Complaint"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </label>
      {children}
    </div>
  );
}
