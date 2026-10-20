import { ArrowRight } from "lucide-react";
import type { Announcement } from "@/types/dashboard";

type Props = { announcements: Announcement[] };

export default function RecentAnnouncements({ announcements }: Props) {
  return (
    <div className="dashboard-card flex h-full min-h-0 flex-col p-3">
      <h3 className="mb-2 shrink-0 text-sm font-bold text-gray-900">
        Recent Announcements
      </h3>

      <div className="min-h-0 flex-1 space-y-2.5 overflow-hidden">
        {announcements.map((item, i) => (
          <div key={item.id} className="rounded-lg bg-gray-50/80 p-2">
            <p className="text-xs font-semibold text-gray-900">
              {i + 1}. {item.title}
            </p>
            <p className="mt-0.5 line-clamp-2 text-[10px] leading-relaxed text-gray-600">
              {item.content}
            </p>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="mt-2 flex shrink-0 items-center gap-1.5 self-end text-[10px] font-medium text-eco-primary hover:underline"
      >
        View All Announcements
        <span className="flex h-5 w-5 items-center justify-center rounded-full border border-eco-primary/30 bg-eco-light">
          <ArrowRight className="h-3 w-3" />
        </span>
      </button>
    </div>
  );
}
