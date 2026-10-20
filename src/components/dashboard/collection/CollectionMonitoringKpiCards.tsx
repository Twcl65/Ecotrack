import { Clock, MapPin, Truck } from "lucide-react";
import type { CollectionMonitoringKpis } from "@/types/collection-monitoring";

type Props = { kpis: CollectionMonitoringKpis };

const CARDS = [
  {
    key: "todaysCollection" as const,
    label: "Today's Collection",
    sublabel: "Schedule",
    icon: Truck,
    iconClass: "bg-emerald-100 text-emerald-700",
  },
  {
    key: "inProgress" as const,
    label: "In Progress",
    sublabel: "Collections",
    icon: Truck,
    iconClass: "bg-blue-100 text-blue-700",
  },
  {
    key: "upcoming" as const,
    label: "Upcoming",
    sublabel: "Schedule",
    icon: Clock,
    iconClass: "bg-amber-100 text-amber-700",
  },
  {
    key: "totalRoutes" as const,
    label: "Total Routes",
    sublabel: "Today",
    icon: MapPin,
    iconClass: "bg-violet-100 text-violet-700",
  },
];

export default function CollectionMonitoringKpiCards({ kpis }: Props) {
  return (
    <div className="collection-kpi-row shrink-0">
      {CARDS.map(({ key, label, sublabel, icon: Icon, iconClass }) => (
        <div
          key={key}
          className="dashboard-card flex items-center gap-3 px-4 py-3"
        >
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconClass}`}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600">{label}</p>
            <p className="text-2xl font-bold leading-tight text-gray-900">
              {kpis[key]}
            </p>
            <p className="text-[11px] text-gray-500">{sublabel}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
