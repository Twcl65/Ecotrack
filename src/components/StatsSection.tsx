import { MapPin, Timer, Truck } from "lucide-react";
import type { SiteMetrics } from "@/types/database";

type StatsSectionProps = {
  metrics: SiteMetrics;
};

const statItems = (metrics: SiteMetrics) => [
  {
    icon: MapPin,
    label: "Total Routes",
    value: metrics.total_routes.toString(),
    subtext: "All Routes",
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    icon: Truck,
    label: "Active Collections",
    value: metrics.active_collections.toString(),
    subtext: "Right Now",
    color: "text-eco-primary",
    bg: "bg-eco-light",
  },
  {
    icon: Timer,
    label: "Total Distance",
    value: metrics.total_distance_km.toFixed(1),
    subtext: "All Routes (km)",
    color: "text-orange-500",
    bg: "bg-orange-50",
  },
];

export default function StatsSection({ metrics }: StatsSectionProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-4 sm:grid-cols-3">
        {statItems(metrics).map(
          ({ icon: Icon, label, value, subtext, color, bg }) => (
            <div
              key={label}
              className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
            >
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${bg}`}
              >
                <Icon className={`h-6 w-6 ${color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-400">{subtext}</p>
              </div>
            </div>
          )
        )}
      </div>
    </section>
  );
}
