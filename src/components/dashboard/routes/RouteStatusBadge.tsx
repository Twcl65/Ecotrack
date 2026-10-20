import type { RouteStatus } from "@/types/routes";

const CONFIG: Record<
  RouteStatus,
  { label: string; className: string }
> = {
  active: {
    label: "Active",
    className: "bg-emerald-100 text-emerald-700",
  },
  inactive: {
    label: "Inactive",
    className: "bg-gray-100 text-gray-600",
  },
  completed: {
    label: "Completed",
    className: "bg-blue-100 text-blue-700",
  },
};

type Props = { status: RouteStatus };

export default function RouteStatusBadge({ status }: Props) {
  const cfg = CONFIG[status];
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}
