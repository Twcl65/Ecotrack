"use client";

import Link from "next/link";
import { LogOut, Menu, User, UserCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profileOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen]);

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
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileOpen((open) => !open)}
            className="flex items-center gap-2 rounded-lg px-1 py-1 transition hover:bg-gray-50"
            aria-expanded={profileOpen}
            aria-haspopup="menu"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-eco-light text-eco-primary">
              <User className="h-4 w-4" />
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-xs font-semibold capitalize leading-none text-gray-900">
                {userName}
              </p>
              <p className="mt-0.5 text-[10px] leading-none text-gray-500">{userEmail}</p>
            </div>
          </button>

          {profileOpen && (
            <div className="absolute right-0 z-30 mt-2 w-52 overflow-hidden rounded-lg border border-gray-100 bg-white py-1 shadow-lg">
              <div className="border-b border-gray-100 px-4 py-3 sm:hidden">
                <p className="text-sm font-semibold capitalize text-gray-900">{userName}</p>
                <p className="mt-0.5 text-xs text-gray-500">{userEmail}</p>
              </div>
              <Link
                href="/dashboard/settings"
                onClick={() => setProfileOpen(false)}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-eco-light"
              >
                <UserCircle className="h-4 w-4 text-eco-primary" />
                Account Profile
              </Link>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
