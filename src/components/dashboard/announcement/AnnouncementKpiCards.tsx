import type { LucideIcon } from "lucide-react";
import { Archive, Clock, Eye, Megaphone, Send } from "lucide-react";
import type { AnnouncementStats } from "@/types/announcement";

type Props = { stats: AnnouncementStats };

const CARDS: {
  key: keyof AnnouncementStats;
  label: string;
  sublabel: string;
  icon: LucideIcon;
  iconClass: string;
}[] = [
  {
    key: "totalThisMonth",
    label: "Total Announcements",
    sublabel: "This Month",
    icon: Megaphone,
    iconClass: "text-emerald-600 bg-emerald-100",
  },
  {
    key: "active",
    label: "Active Announcements",
    sublabel: "Currently Active",
    icon: Send,
    iconClass: "text-blue-600 bg-blue-100",
  },
  {
    key: "scheduled",
    label: "Scheduled",
    sublabel: "Upcoming",
    icon: Clock,
    iconClass: "text-amber-600 bg-amber-100",
  },
  {
    key: "expired",
    label: "Expired",
    sublabel: "No Longer Active",
    icon: Archive,
    iconClass: "text-red-600 bg-red-100",
  },
  {
    key: "totalViewsThisMonth",
    label: "Total Views",
    sublabel: "This Month",
    icon: Eye,
    iconClass: "text-purple-600 bg-purple-100",
  },
];

export default function AnnouncementKpiCards({ stats }: Props) {
  return (
    <div className="announcement-kpi-row shrink-0">
      {CARDS.map(({ key, label, sublabel, icon: Icon, iconClass }) => (
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
            <p className="text-xl font-bold text-gray-900">
              {key === "totalViewsThisMonth"
                ? stats[key].toLocaleString()
                : stats[key]}
            </p>
            <p className="text-[11px] text-gray-500">{sublabel}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
