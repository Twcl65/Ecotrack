"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import DashboardSidebar from "./DashboardSidebar";
import DashboardHeader from "./DashboardHeader";
import type { AdminNotification } from "@/types/notifications";

type DashboardShellProps = {
  children: React.ReactNode;
  userName: string;
  userEmail: string;
  notifications: AdminNotification[];
};

export default function DashboardShell({
  children,
  userName,
  userEmail,
  notifications,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const isFullHeight =
    pathname === "/dashboard" ||
    pathname === "/dashboard/schedules" ||
    pathname === "/dashboard/barangay" ||
    pathname === "/dashboard/complaint" ||
    pathname === "/dashboard/announcement" ||
    pathname === "/dashboard/users";

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f6f5]">
      <DashboardSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <DashboardHeader
          userName={userName}
          userEmail={userEmail}
          notifications={notifications}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main
          className={`min-h-0 flex-1 ${
            isFullHeight
              ? "overflow-hidden p-3 lg:p-4"
              : "overflow-y-auto p-4 lg:p-6"
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
