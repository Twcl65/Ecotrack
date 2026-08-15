"use client";

import { Menu, User } from "lucide-react";
import { usePathname } from "next/navigation";
import DashboardNotifications from "./DashboardNotifications";
import type { AdminNotification } from "@/types/notifications";

const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/schedules": "Schedules",
  "/dashboard/barangay": "Barangay",
  "/dashboard/complaint": "Complaints",
  "/dashboard/report": "Reports",
  "/dashboard/announcement": "Announcements",
  "/dashboard/users": "User Management",
  "/dashboard/collection": "Collection Monitoring",
  "/dashboard/routes": "Route Management",
  "/dashboard/settings": "Settings",
};

type Props = {
  userName: string;
  userEmail: string;
  notifications: AdminNotification[];
  onMenuClick: () => void;
};

export default function DashboardHeader({
  userName,
  userEmail,
  notifications,
  onMenuClick,
}: Props) {
  const pathname = usePathname();

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-gray-200/80 bg-white px-4">
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-md p-1.5 text-gray-700 hover:bg-gray-100"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-base font-bold text-gray-900">
          {TITLES[pathname] ?? "Dashboard"}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <DashboardNotifications notifications={notifications} />
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-eco-light text-eco-primary">
            <User className="h-4 w-4" />
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold capitalize leading-none text-gray-900">
              {userName}
            </p>
            <p className="mt-0.5 text-[10px] leading-none text-gray-500">{userEmail}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
