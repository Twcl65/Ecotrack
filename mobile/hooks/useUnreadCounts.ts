import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { useAuth } from "@/context/AuthContext";
import {
  buildDriverNotifications,
  buildNotifications,
} from "@/lib/data/notifications";
import { filterDriverSchedules } from "@/lib/data/driver";
import { fetchAnnouncements } from "@/lib/data/announcements";
import { fetchUserComplaints } from "@/lib/data/complaints";
import { fetchSchedules } from "@/lib/data/schedules";

type Module = "resident" | "driver";

type UnreadCounts = {
  announcements: number;
  notifications: number;
};

const READ_KEYS: Record<Module, { announcements: string; notifications: string }> = {
  resident: {
    announcements: "ecotrack-resident-ann-read",
    notifications: "ecotrack-resident-notif-read",
  },
  driver: {
    announcements: "ecotrack-driver-ann-read",
    notifications: "ecotrack-driver-notif-read",
  },
};

function parseReadIds(raw: string | null): Set<string> {
  if (!raw) return new Set();
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed) || !parsed.every((id) => typeof id === "string")) {
    throw new Error("Stored read status is invalid.");
  }
  return new Set(parsed);
}

export function useUnreadCounts(module: Module): UnreadCounts {
  const { profile } = useAuth();
  const [counts, setCounts] = useState<UnreadCounts>({
    announcements: 0,
    notifications: 0,
  });

  const load = useCallback(async () => {
    try {
      const readKeys = READ_KEYS[module];
      const [announcements, schedules, announcementReadRaw, notificationReadRaw, complaints] =
        await Promise.all([
          fetchAnnouncements(),
          fetchSchedules(true),
          AsyncStorage.getItem(readKeys.announcements),
          AsyncStorage.getItem(readKeys.notifications),
          module === "resident"
            ? fetchUserComplaints(
                profile?.fullName ?? "",
                profile?.phone ?? "",
                profile?.id
              )
            : Promise.resolve([]),
        ]);
      const announcementReadIds = parseReadIds(announcementReadRaw);
      const notificationReadIds = parseReadIds(notificationReadRaw);
      const notificationItems =
        module === "driver"
          ? buildDriverNotifications(
              filterDriverSchedules(schedules, profile?.fullName ?? "Driver")
            )
          : buildNotifications(schedules, complaints);

      setCounts({
        announcements: announcements.filter(
          (announcement) => !announcementReadIds.has(announcement.id)
        ).length,
        notifications: notificationItems.filter(
          (notification) => !notificationReadIds.has(notification.id)
        ).length,
      });
    } catch (error) {
      Alert.alert(
        "Could not load unread counts",
        error instanceof Error ? error.message : "Please try again."
      );
    }
  }, [module, profile]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  return counts;
}
