"use client";

import { CalendarDays } from "lucide-react";
import { useEffect, useState } from "react";

type Props = { userName: string };

export default function DashboardWelcome({ userName }: Props) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const dateStr = now?.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }) ?? "—";

  const timeStr = now
    ? `${now.toLocaleDateString("en-US", { weekday: "long" })}, ${now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`
    : "—";

  return (
    <div className="flex shrink-0 items-start justify-between gap-3">
      <div>
        <h2 className="text-sm font-bold text-gray-900 sm:text-base">
          Welcome back, {userName}!
        </h2>
        <p className="mt-0.5 text-xs text-gray-500">
          Here&apos;s what&apos;s happening with solid waste collection in Jasaan,
          Misamis Oriental.
        </p>
      </div>

      <div className="dashboard-card flex shrink-0 items-center gap-2.5 px-3 py-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-eco-light">
          <CalendarDays className="h-4 w-4 text-eco-primary" />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-900">{dateStr}</p>
          <p className="text-[10px] text-gray-500">{timeStr}</p>
        </div>
      </div>
    </div>
  );
}
