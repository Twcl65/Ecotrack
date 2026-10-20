import type { SystemUser, UserFormValues } from "@/types/user";

export function formatUserDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatUserTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  return phone;
}

export function buildFullName(
  first: string,
  middle: string | null,
  last: string
): string {
  return [first, middle?.trim(), last].filter(Boolean).join(" ");
}

export function avatarUrlForUser(name: string, email: string): string {
  const seed = encodeURIComponent(name || email);
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
}

export function mapSystemUserRow(row: {
  id: string;
  user_code: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  username: string;
  status: string;
  avatar_url: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}): SystemUser {
  const fullName = buildFullName(
    row.first_name,
    row.middle_name,
    row.last_name
  );

  return {
    id: row.id,
    userCode: row.user_code,
    firstName: row.first_name,
    middleName: row.middle_name,
    lastName: row.last_name,
    fullName,
    email: row.email,
    phone: row.phone,
    role: row.role as SystemUser["role"],
    username: row.username,
    status: row.status as SystemUser["status"],
    avatarUrl: row.avatar_url ?? avatarUrlForUser(fullName, row.email),
    lastLoginAt: row.last_login_at,
    lastLoginLabel: row.last_login_at
      ? `${formatUserDate(row.last_login_at)} at ${formatUserTime(row.last_login_at)}`
      : null,
    createdAt: row.created_at,
    dateLabel: formatUserDate(row.created_at),
    timeLabel: formatUserTime(row.created_at),
    updated_at: row.updated_at,
  };
}

export function userToFormValues(user: SystemUser): UserFormValues {
  return {
    firstName: user.firstName,
    middleName: user.middleName ?? "",
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    username: user.username,
    password: "",
    confirmPassword: "",
    status: user.status,
  };
}

export function defaultUserFormValues(): UserFormValues {
  return {
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "resident",
    username: "",
    password: "",
    confirmPassword: "",
    status: "active",
  };
}

export function formToRow(values: UserFormValues) {
  return {
    first_name: values.firstName.trim(),
    middle_name: values.middleName.trim() || null,
    last_name: values.lastName.trim(),
    email: values.email.trim().toLowerCase(),
    phone: values.phone.trim(),
    role: values.role,
    username: values.username.trim(),
    status: values.status,
    updated_at: new Date().toISOString(),
  };
}
