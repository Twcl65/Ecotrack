import {
  USER_ROLE_CONFIG,
  USER_STATUS_CONFIG,
  type UserRole,
  type UserStatus,
} from "@/types/user";

export function UserRoleBadge({ role }: { role: UserRole }) {
  const cfg = USER_ROLE_CONFIG[role];
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}

export function UserStatusBadge({ status }: { status: UserStatus }) {
  const cfg = USER_STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}

export function UserRolePill({ role }: { role: UserRole }) {
  const cfg = USER_ROLE_CONFIG[role];
  return (
    <span className="inline-flex rounded-full bg-eco-primary px-3 py-0.5 text-xs font-semibold text-white">
      {cfg.label}
    </span>
  );
}
