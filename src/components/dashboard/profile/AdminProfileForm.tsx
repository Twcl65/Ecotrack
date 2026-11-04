"use client";

import { Camera, Check, ImagePlus, LockKeyhole, Pencil, ShieldCheck, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveAdminProfile } from "@/app/dashboard/profile/actions";
import { createClient } from "@/lib/supabase/client";

type AdminProfile = {
  fullName: string;
  username: string;
  email: string;
  role: string;
  status: string;
  avatarUrl: string | null;
};

type Props = {
  userId: string;
  initialProfile: AdminProfile;
};

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-eco-primary focus:ring-2 focus:ring-eco-primary/20";
const readOnlyClass =
  "flex w-full items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2.5 text-sm text-gray-500";

export default function AdminProfileForm({ userId, initialProfile }: Props) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialProfile.fullName);
  const [email, setEmail] = useState(initialProfile.email);
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatarUrl);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!avatarPreview) return;
    return () => URL.revokeObjectURL(avatarPreview);
  }, [avatarPreview]);

  function cancelChanges() {
    const referrer = document.referrer;
    if (referrer && new URL(referrer).origin === window.location.origin) {
      router.back();
      return;
    }
    router.push("/dashboard");
  }

  async function uploadAvatar(file: File): Promise<string> {
    const extension = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
    const path = `${userId}/admin-profile-${Date.now()}.${extension}`;
    const supabase = createClient();
    const { error: uploadError } = await supabase.storage
      .from("user-avatars")
      .upload(path, file, { contentType: file.type });
    if (uploadError) throw new Error(uploadError.message);

    return supabase.storage.from("user-avatars").getPublicUrl(path).data.publicUrl;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);

    try {
      const savedAvatarUrl = avatarFile ? await uploadAvatar(avatarFile) : avatarUrl;
      const result = await saveAdminProfile({
        fullName,
        email,
        avatarUrl: avatarFile ? savedAvatarUrl : null,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      setAvatarUrl(savedAvatarUrl);
      setAvatarFile(null);
      setAvatarPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setNotice(
        result.emailChangePending
          ? "Profile saved. Check your email to confirm the new email address."
          : "Profile changes saved successfully."
      );
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save your profile."
      );
    } finally {
      setSaving(false);
    }
  }

  const image = avatarPreview || avatarUrl;
  const initials =
    fullName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "A";

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-5xl">
      <header className="mb-4 flex items-center gap-3 rounded-xl bg-eco-light px-5 py-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-eco-primary text-white">
          <Pencil className="h-5 w-5" />
        </span>
        <h2 className="text-lg font-bold text-eco-dark">Edit Admin Profile</h2>
      </header>

      <div className="grid gap-4 lg:grid-cols-[230px_minmax(0,1fr)]">
        <section className="dashboard-card flex flex-col items-center p-5 text-center">
          <div className="relative mb-4 flex h-32 w-32 items-center justify-center overflow-hidden rounded-full bg-eco-light text-4xl font-semibold text-eco-primary">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="Admin profile" className="h-full w-full object-cover" />
            ) : (
              <span>{initials}</span>
            )}
            <span className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-eco-primary text-white">
              <Camera className="h-4 w-4" />
            </span>
          </div>

          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-eco-primary px-4 py-2 text-sm font-semibold text-eco-primary hover:bg-eco-light">
            <ImagePlus className="h-4 w-4" />
            Change Photo
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                if (!file) return;
                if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
                  setAvatarFile(null);
                  setError("Choose a JPG, PNG, or WebP image.");
                  event.target.value = "";
                  return;
                }
                if (file.size > 5 * 1024 * 1024) {
                  setAvatarFile(null);
                  setError("Profile photos must be 5 MB or smaller.");
                  event.target.value = "";
                  return;
                }
                setError(null);
                setNotice(null);
                setAvatarFile(file);
                setAvatarPreview(URL.createObjectURL(file));
              }}
            />
          </label>
          <p className="mt-2 text-[11px] text-gray-500">JPG, PNG, or WebP · Max size: 5 MB</p>

          <div className="mt-6 w-full rounded-lg bg-eco-light/70 p-3 text-left">
            <p className="flex items-center gap-2 text-xs font-semibold text-eco-dark">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              Account security
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-gray-600">
              Your role and account status are read-only and cannot be changed here.
            </p>
          </div>
        </section>

        <section className="dashboard-card p-5 sm:p-6">
          <h3 className="mb-5 flex items-center gap-2 rounded-lg bg-eco-light px-3 py-2.5 text-sm font-bold text-eco-dark">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-eco-primary text-white">
              <Pencil className="h-3.5 w-3.5" />
            </span>
            Personal Information
          </h3>

          <div className="space-y-4">
            <Field label="Full Name" required>
              <input
                type="text"
                required
                maxLength={120}
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="Username">
              <ReadOnlyValue value={initialProfile.username || "—"} />
            </Field>

            <Field label="Email Address" required>
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="Role">
              <ReadOnlyValue value={initialProfile.role} />
            </Field>

            <Field label="Account Status">
              <ReadOnlyValue value={initialProfile.status} />
            </Field>
          </div>

          {error && (
            <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          {notice && (
            <p role="status" className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {notice}
            </p>
          )}
        </section>
      </div>

      <footer className="mt-4 flex flex-col-reverse justify-end gap-2 rounded-xl bg-white p-4 sm:flex-row sm:px-6">
        <button
          type="button"
          onClick={cancelChanges}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          <X className="h-4 w-4" />
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-eco-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-eco-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? <LockKeyhole className="h-4 w-4" /> : <Check className="h-4 w-4" />}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </footer>
    </form>
  );
}

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-gray-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}

function ReadOnlyValue({ value }: { value: string }) {
  return (
    <span className={readOnlyClass}>
      <span>{value}</span>
      <span className="inline-flex shrink-0 items-center gap-1 text-[10px] text-gray-400">
        <LockKeyhole className="h-3 w-3" />
        Read only
      </span>
    </span>
  );
}
