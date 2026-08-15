import type { ComplaintStatus } from "@/types/complaint";
import { COMPLAINT_STATUS_CONFIG } from "@/types/complaint";

type Props = { status: ComplaintStatus };

export default function ComplaintStatusBadge({ status }: Props) {
  const { label, className } = COMPLAINT_STATUS_CONFIG[status];

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${className}`}
    >
      {label}
    </span>
  );
}
