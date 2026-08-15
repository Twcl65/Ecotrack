import type { ReportKpis } from "@/types/reports";

type Props = { kpis: ReportKpis };

const CARDS: {
  key: keyof ReportKpis;
  label: string;
  format: (v: number) => string;
}[] = [
  { key: "totalCollections", label: "Total Collections", format: (v) => String(v) },
  { key: "totalComplaints", label: "Total Complaints", format: (v) => String(v) },
  { key: "activeDrivers", label: "Active Drivers", format: (v) => String(v) },
  {
    key: "collectionRate",
    label: "Collection Rate",
    format: (v) => `${v}%`,
  },
  {
    key: "totalWasteKg",
    label: "Total waste Collected",
    format: (v) => `${v.toLocaleString()} kg`,
  },
];

export default function ReportKpiCards({ kpis }: Props) {
  return (
    <div className="reports-kpi-row shrink-0">
      {CARDS.map(({ key, label, format }) => (
        <div
          key={key}
          className="dashboard-card flex flex-col items-center justify-center px-3 py-3 text-center"
        >
          <p className="text-xs font-medium text-gray-600">{label}</p>
          <p className="mt-1 text-xl font-bold text-gray-900 sm:text-2xl">
            {format(kpis[key])}
          </p>
          <p className="mt-0.5 text-[11px] text-gray-500">This Month</p>
        </div>
      ))}
    </div>
  );
}
