import Link from "next/link";
import { CalendarDays, CheckCircle2, ChevronRight, Clock } from "lucide-react";
import type { WeeklyScheduleItem } from "@/types/dashboard";

type Props = { schedule: WeeklyScheduleItem[] };

export default function WeeklySchedule({ schedule }: Props) {
  return (
    <div className="dashboard-card flex h-full min-h-0 flex-col p-3">
      <div className="mb-2 flex shrink-0 items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-eco-primary" />
          <h3 className="text-sm font-bold text-gray-900">
            Weekly Collection Schedule
          </h3>
        </div>
        <Link
          href="/dashboard/schedules"
          className="flex items-center gap-0.5 rounded-md border border-gray-200 px-2 py-0.5 text-[10px] font-medium text-gray-600 transition hover:bg-gray-50 hover:text-eco-primary"
        >
          View Full Schedules
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-5 gap-2">
        {schedule.map((item) => {
          const done = item.status === "completed";
          const today = item.isToday;
          return (
            <div
              key={item.id}
              className={`flex flex-col items-center justify-between rounded-lg border px-1.5 py-2 text-center ${
                today
                  ? "border-2 border-eco-primary bg-eco-light/40 shadow-sm"
                  : done
                    ? "border-eco-primary/30 bg-eco-light/70"
                    : "border-gray-100 bg-gray-50/50"
              }`}
            >
              <div>
                <p
                  className={`text-[10px] font-bold ${today ? "text-eco-primary" : "text-gray-500"}`}
                >
                  {item.day}
                </p>
                <p className="text-[9px] text-gray-400">{item.date}</p>
                <p className="mt-1 line-clamp-2 text-[10px] font-semibold leading-tight text-gray-800">
                  {item.barangay}
                </p>
              </div>
              {done ? (
                <CheckCircle2 className="mt-1.5 h-4 w-4 text-eco-primary" />
              ) : (
                <Clock className="mt-1.5 h-4 w-4 text-gray-400" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
