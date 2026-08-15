"use client";

import {
  AlertTriangle,
  Bell,
  CalendarClock,
  Megaphone,
  Truck,
  Info,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AdminNotification, NotificationTone } from "@/types/notifications";
import { NOTIFICATION_TONE_STYLES } from "@/types/notifications";

const READ_KEY = "ecotrack-read-notifications";

const TONE_ICONS: Record<
  NotificationTone,
  React.ComponentType<{ className?: string }>
> = {
  complaint: AlertTriangle,
  schedule: CalendarClock,
  announcement: Megaphone,
  collection: Truck,
  info: Info,
};

type Props = {
  notifications: AdminNotification[];
};

function loadReadIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(READ_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveReadIds(ids: Set<string>) {
  localStorage.setItem(READ_KEY, JSON.stringify([...ids]));
}

export default function DashboardNotifications({ notifications }: Props) {
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setReadIds(loadReadIds());
  }, []);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const unreadCount = notifications.filter(
    (n) => n.id !== "info-empty" && n.id !== "info-error" && !readIds.has(n.id)
  ).length;

  const markAllRead = useCallback(() => {
    const next = new Set(readIds);
    for (const n of notifications) next.add(n.id);
    setReadIds(next);
    saveReadIds(next);
  }, [notifications, readIds]);

  const markRead = useCallback(
    (id: string) => {
      const next = new Set(readIds);
      next.add(id);
      setReadIds(next);
      saveReadIds(next);
    },
    [readIds]
  );

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,360px)] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h2 className="text-sm font-bold text-gray-900">Notifications</h2>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs font-medium text-eco-primary hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <ul className="max-h-80 overflow-y-auto">
            {notifications.map((item) => {
              const styles = NOTIFICATION_TONE_STYLES[item.tone];
              const Icon = TONE_ICONS[item.tone];
              const unread =
                item.id !== "info-empty" &&
                item.id !== "info-error" &&
                !readIds.has(item.id);

              const content = (
                <div
                  className={`flex gap-3 px-4 py-3 transition-colors hover:bg-gray-50 ${
                    unread ? "bg-eco-light/30" : ""
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${styles.iconBg}`}
                  >
                    <Icon className={`h-4 w-4 ${styles.iconColor}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-gray-600">
                      {item.message}
                    </p>
                    <p className="mt-1 text-[10px] text-gray-400">{item.timeLabel}</p>
                  </div>
                  {unread && (
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-eco-primary" />
                  )}
                </div>
              );

              return (
                <li key={item.id} className="border-b border-gray-50 last:border-0">
                  {item.href ? (
                    <Link
                      href={item.href}
                      onClick={() => {
                        markRead(item.id);
                        setOpen(false);
                      }}
                    >
                      {content}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className="w-full text-left"
                      onClick={() => markRead(item.id)}
                    >
                      {content}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
