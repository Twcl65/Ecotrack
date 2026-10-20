import { CheckCircle2, Clock, MapPin, Truck } from "lucide-react";
import type { RouteStats } from "@/types/routes";
import { formatDistance } from "@/types/routes";

type Props = { stats: RouteStats };

const CARDS = [
  {
    key: "totalRoutes" as const,
    label: "Total Routes",
    sublabel: "All Routes",
    icon: MapPin,
    iconClass: "bg-emerald-100 text-emerald-700",
  },
  {
    key: "activeRoutes" as const,
    label: "Active Routes",
    sublabel: "Currently Active",
    icon: Truck,
    iconClass: "bg-blue-100 text-blue-700",
  },
  {
    key: "totalDistanceKm" as const,
    label: "Total Distance",
    sublabel: "All Routes",
    icon: Clock,
    iconClass: "bg-amber-100 text-amber-700",
    format: (v: number) => formatDistance(v),
  },
  {
    key: "completedToday" as const,
    label: "Completed Today",
    sublabel: "Routes",
    icon: CheckCircle2,
    iconClass: "bg-emerald-100 text-emerald-700",
  },
];

export default function RouteKpiCards({ stats }: Props) {
  return (
    <div className="route-kpi-row shrink-0">
      {CARDS.map(({ key, label, sublabel, icon: Icon, iconClass, format }) => (
        <div
          key={key}
          className="dashboard-card flex items-center gap-2 px-2.5 py-1.5"
        >
          <div
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${iconClass}`}
          >
            <Icon className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0 leading-none">
            <p className="truncate text-[10px] font-medium text-gray-600">{label}</p>
            <p className="mt-0.5 text-lg font-bold text-gray-900">
              {format ? format(stats[key] as number) : stats[key]}
            </p>
            <p className="mt-0.5 text-[9px] text-gray-500">{sublabel}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
