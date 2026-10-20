import type { ScheduleStatus } from "@/types/schedules";
import { SCHEDULE_STATUS_CONFIG } from "@/types/schedules";

type Props = { status: ScheduleStatus };

export default function ScheduleStatusBadge({ status }: Props) {
  const { label, className } = SCHEDULE_STATUS_CONFIG[status];

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${className}`}
    >
      {label}
    </span>
  );
}
