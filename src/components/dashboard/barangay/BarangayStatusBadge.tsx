import type { BarangayStatus } from "@/types/barangay";
import { BARANGAY_STATUS_CONFIG } from "@/types/barangay";

type Props = { status: BarangayStatus };

export default function BarangayStatusBadge({ status }: Props) {
  const { label, className } = BARANGAY_STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${className}`}
    >
      {label}
    </span>
  );
}
