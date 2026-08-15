import type { AnnouncementDisplayStatus, AnnouncementType } from "@/types/announcement";
import {
  ANNOUNCEMENT_STATUS_CONFIG,
  ANNOUNCEMENT_TYPE_CONFIG,
} from "@/types/announcement";

export function AnnouncementTypeBadge({ type }: { type: AnnouncementType }) {
  const { label, className } = ANNOUNCEMENT_TYPE_CONFIG[type];
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${className}`}
    >
      {label}
    </span>
  );
}

export function AnnouncementStatusBadge({
  status,
}: {
  status: AnnouncementDisplayStatus;
}) {
  const { label, className } = ANNOUNCEMENT_STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${className}`}
    >
      {label}
    </span>
  );
}
