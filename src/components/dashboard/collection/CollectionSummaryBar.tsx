import {
  CheckCircle2,
  CircleDashed,
  ClipboardList,
  Clock,
  Truck,
  XCircle,
} from "lucide-react";
import type { CollectionSummary } from "@/types/collection-monitoring";

type Props = { summary: CollectionSummary };

const ITEMS = [
  { key: "total" as const, label: "Total Collections", icon: Truck, color: "text-emerald-600" },
  { key: "completed" as const, label: "Completed", icon: CheckCircle2, color: "text-emerald-600" },
  { key: "inProgress" as const, label: "In Progress", icon: CircleDashed, color: "text-blue-600" },
  { key: "pending" as const, label: "Pending", icon: Clock, color: "text-amber-600" },
  { key: "cancelled" as const, label: "Cancelled", icon: XCircle, color: "text-red-500" },
];

export default function CollectionSummaryBar({ summary }: Props) {
  return (
    <div className="dashboard-card shrink-0 px-4 py-3">
      <p className="mb-3 text-sm font-bold text-gray-900">Collection Summary (Today)</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {ITEMS.map(({ key, label, icon: Icon, color }) => (
          <div key={key} className="flex items-center gap-2">
            <Icon className={`h-4 w-4 shrink-0 ${color}`} />
            <div>
              <p className="text-[10px] text-gray-500">{label}</p>
              <p className="text-lg font-bold text-gray-900">{summary[key]}</p>
            </div>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 shrink-0 text-violet-600" />
          <div>
            <p className="text-[10px] text-gray-500">Total Waste Collected</p>
            <p className="text-lg font-bold text-gray-900">
              {summary.wasteKg.toLocaleString()} kg
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
