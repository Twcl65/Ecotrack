import type { LucideIcon } from "lucide-react";
import { Shield, Truck, UserRound, UserRoundX, Users } from "lucide-react";
import type { UserStats } from "@/types/user";

type Props = { stats: UserStats };

const CARDS: {
  key: keyof UserStats;
  label: string;
  icon: LucideIcon;
  iconClass: string;
}[] = [
  {
    key: "total",
    label: "Total Users",
    icon: Users,
    iconClass: "text-emerald-600 bg-emerald-100",
  },
  {
    key: "administrators",
    label: "Administrators",
    icon: Shield,
    iconClass: "text-blue-600 bg-blue-100",
  },
  {
    key: "drivers",
    label: "Drivers",
    icon: Truck,
    iconClass: "text-emerald-600 bg-emerald-100",
  },
  {
    key: "residents",
    label: "Residents",
    icon: UserRound,
    iconClass: "text-orange-600 bg-orange-100",
  },
  {
    key: "inactive",
    label: "Inactive Users",
    icon: UserRoundX,
    iconClass: "text-red-600 bg-red-100",
  },
];

export default function UserKpiCards({ stats }: Props) {
  return (
    <div className="users-kpi-row shrink-0">
      {CARDS.map(({ key, label, icon: Icon, iconClass }) => (
        <div
          key={key}
          className="dashboard-card flex items-center gap-3 px-3 py-3"
        >
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconClass}`}
          >
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-gray-600">
              {label}
            </p>
            <p className="text-xl font-bold text-gray-900">{stats[key]}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
