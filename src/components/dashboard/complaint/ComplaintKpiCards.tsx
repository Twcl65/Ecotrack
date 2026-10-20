import type { ComplaintStats } from "@/types/complaint";

type Props = { stats: ComplaintStats };

const CARDS: {
  key: keyof ComplaintStats;
  label: string;
  sublabel: string;
}[] = [
  { key: "totalThisMonth", label: "Total Complaints", sublabel: "This Month" },
  { key: "pending", label: "Pending", sublabel: "Complaints" },
  { key: "inProgress", label: "In Progress", sublabel: "Complaints" },
  { key: "resolved", label: "Resolved", sublabel: "Complaints" },
  { key: "declined", label: "Declined", sublabel: "Complaints" },
];

export default function ComplaintKpiCards({ stats }: Props) {
  return (
    <div className="complaint-kpi-row shrink-0">
      {CARDS.map(({ key, label, sublabel }) => (
        <div
          key={key}
          className="dashboard-card flex flex-col items-center justify-center px-3 py-3 text-center"
        >
          <p className="text-xs font-medium text-gray-600">{label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{stats[key]}</p>
          <p className="mt-0.5 text-[11px] text-gray-500">{sublabel}</p>
        </div>
      ))}
    </div>
  );
}
