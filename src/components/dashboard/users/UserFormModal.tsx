"use client";

import { ChevronDown, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  createSystemUser,
  updateSystemUser,
} from "@/app/dashboard/users/actions";
import {
  defaultUserFormValues,
  userToFormValues,
} from "@/lib/users/format";
import type { SystemUser, UserFormValues, UserRole } from "@/types/user";
import { USER_ROLE_OPTIONS } from "@/types/user";

type Props = {
  mode: "add" | "edit";
  user?: SystemUser;
  open: boolean;
  onClose: () => void;
  onSuccess: (user: SystemUser) => void;
};

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white py-2.5 px-3 text-sm outline-none focus:border-eco-primary focus:ring-2 focus:ring-eco-primary/20";

export default function UserFormModal({
  mode,
  user,
  open,
  onClose,
  onSuccess,
}: Props) {
  const [form, setForm] = useState<UserFormValues>(defaultUserFormValues());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (mode === "edit" && user) {
      setForm(userToFormValues(user));
    } else {
      setForm(defaultUserFormValues());
    }
  }, [open, mode, user]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result =
      mode === "edit" && user
        ? await updateSystemUser(user.id, form)
        : await createSystemUser(form);

    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }

    if (result.user) onSuccess(result.user);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-lg font-bold text-gray-900">
            {mode === "add" ? "Add New User" : "Edit User"}
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

        <form onSubmit={handleSubmit} className="space-y-5 px-5 py-4">
          <Section title="Personal Information">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="First Name" required>
                <input
                  type="text"
                  required
                  value={form.firstName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, firstName: e.target.value }))
                  }
                  placeholder="First name"
                  className={inputClass}
                />
              </Field>
              <Field label="Email" required>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  placeholder="Email address"
                  className={inputClass}
                />
              </Field>
              <Field label="Middle Name (Optional)">
                <input
                  type="text"
                  value={form.middleName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, middleName: e.target.value }))
                  }
                  placeholder="Middle name"
                  className={inputClass}
                />
              </Field>
              <Field label="Contact Number" required>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  placeholder="0912 345 6789"
                  className={inputClass}
                />
              </Field>
              <Field label="Last Name" required>
                <input
                  type="text"
                  required
                  value={form.lastName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, lastName: e.target.value }))
                  }
                  placeholder="Last name"
                  className={inputClass}
                />
              </Field>
            </div>
          </Section>

          <Section title="Account Information">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="User Role" required>
                <Select
                  value={form.role}
                  onChange={(v) =>
                    setForm((f) => ({ ...f, role: v as UserRole }))
                  }
                  options={USER_ROLE_OPTIONS.map((o) => ({
                    value: o.value,
                    label: o.label,
                  }))}
                  placeholder="Select role"
                />
              </Field>
              {mode === "add" ? (
                <Field label="Password" required>
                  <input
                    type="password"
                    required
                    value={form.password}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, password: e.target.value }))
                    }
                    placeholder="Password"
                    className={inputClass}
                  />
                </Field>
              ) : (
                <>
                  <Field label="Status" required>
                    <Select
                      value={form.status}
                      onChange={(v) =>
                        setForm((f) => ({
                          ...f,
                          status: v as UserFormValues["status"],
                        }))
                      }
                      options={[
                        { value: "active", label: "Active" },
                        { value: "inactive", label: "Inactive" },
                      ]}
                      placeholder="Select status"
                    />
                  </Field>
                  <Field label="New Password">
                    <input
                      type="password"
                      value={form.password}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, password: e.target.value }))
                      }
                      placeholder="Leave blank to keep current"
                      className={inputClass}
                    />
                  </Field>
                </>
              )}
              <Field label="Username" required>
                <input
                  type="text"
                  required
                  value={form.username}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, username: e.target.value }))
                  }
                  placeholder="Username"
                  className={inputClass}
                />
              </Field>
              {mode === "add" ? (
                <Field label="Confirm Password" required>
                  <input
                    type="password"
                    required
                    value={form.confirmPassword}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        confirmPassword: e.target.value,
                      }))
                    }
                    placeholder="Confirm password"
                    className={inputClass}
                  />
                </Field>
              ) : (
                <Field label="Confirm New Password">
                  <input
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        confirmPassword: e.target.value,
                      }))
                    }
                    placeholder="Confirm new password"
                    className={inputClass}
                  />
                </Field>
              )}
            </div>
          </Section>

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
              {loading ? "Saving..." : mode === "add" ? "Save User" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-bold text-gray-900">{title}</h3>
      {children}
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
