"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  FileText,
  LayoutDashboard,
  Leaf,
  MapPin,
  Megaphone,
  MessageSquareWarning,
  Route,
  Settings,
  Truck,
  Users,
  X,
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/schedules", label: "Schedules", icon: Calendar },
  { href: "/dashboard/barangay", label: "Barangay", icon: MapPin },
  { href: "/dashboard/complaint", label: "Complaint", icon: MessageSquareWarning },
  { href: "/dashboard/report", label: "Report", icon: FileText },
  { href: "/dashboard/announcement", label: "Announcement", icon: Megaphone },
  { href: "/dashboard/users", label: "User Management", icon: Users },
  { href: "/dashboard/collection", label: "Collection Monitoring", icon: Truck },
  { href: "/dashboard/routes", label: "Route Management", icon: Route },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

type Props = { open: boolean; onClose: () => void };

export default function DashboardSidebar({ open, onClose }: Props) {
  const pathname = usePathname();

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[220px] shrink-0 flex-col bg-[#153d2b] text-white transition-transform lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-2.5 border-b border-white/10 px-4 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-eco-primary">
            <Leaf className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold tracking-wide">ECOTRACK</p>
            <p className="text-[9px] leading-tight text-emerald-200/70">
              Cleaner Jasaan, Greener Tomorrow
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 hover:bg-white/10 lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`mb-0.5 flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition ${
                  active
                    ? "bg-eco-primary text-white shadow-sm"
                    : "text-emerald-100/90 hover:bg-white/10"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 px-3 py-3">
          <p className="text-center text-[10px] font-medium tracking-wide text-emerald-200/60">
            Ecotrack v00.1
          </p>
        </div>
      </aside>
    </>
  );
}
