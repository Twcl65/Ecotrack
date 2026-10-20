import { Calendar, ChevronDown, MapPin, Scale } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { DashboardKpis } from "@/types/dashboard";

type CardDef = {
  key: string;
  label: string;
  icon?: LucideIcon;
  dropdown?: boolean;
  height: string;
  getValue: (k: DashboardKpis) => string;
};

const CARDS: CardDef[] = [
  {
    key: "today",
    label: "Today's Collection",
    icon: Calendar,
    dropdown: true,
    height: "76px",
    getValue: (k) => String(k.todaysCollection),
  },
  {
    key: "barangay",
    label: "Total Barangay",
    icon: MapPin,
    height: "76px",
    getValue: (k) => String(k.totalBarangay),
  },
  {
    key: "complaint",
    label: "Total Complaint",
    height: "76px",
    getValue: (k) => String(k.totalComplaint),
  },
  {
    key: "waste",
    label: "Waste Collected",
    icon: Scale,
    height: "76px",
    getValue: (k) => `${k.wasteCollectedKg.toLocaleString()} kg`,
  },
];

type Props = { kpis: DashboardKpis };

export default function KpiCards({ kpis }: Props) {
  return (
    <div className="kpi-cards-row shrink-0">
      {CARDS.map(({ key, label, icon: Icon, dropdown, height, getValue }) => (
        <div
          key={key}
          className="dashboard-card flex flex-col justify-between px-3 py-2.5"
          style={{ height }}
        >
          <div className="flex items-center justify-between gap-1">
            <div className="flex min-w-0 items-center gap-1.5">
              {Icon && <Icon className="h-3.5 w-3.5 shrink-0 text-gray-400" />}
              <span className="truncate text-xs font-medium text-gray-600">
                {label}
              </span>
            </div>
            {dropdown && <ChevronDown className="h-3.5 w-3.5 shrink-0 text-gray-400" />}
          </div>
          <p className="text-xl font-bold tracking-tight text-gray-900">
            {getValue(kpis)}
          </p>
        </div>
      ))}
    </div>
  );
}
