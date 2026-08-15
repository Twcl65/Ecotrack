import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import AppHeader from "@/components/AppHeader";
import { useTheme } from "@/context/ThemeContext";
import { fetchAnnouncements } from "@/lib/data/announcements";
import { buildDriverNotifications, type NotificationItem } from "@/lib/data/notifications";
import { fetchSchedules } from "@/lib/data/schedules";
import { filterDriverSchedules } from "@/lib/data/driver";
import { fetchDriverRoute } from "@/lib/data/routes";
import { useAuth } from "@/context/AuthContext";
import { fontSize, radius, spacing, type ThemeColors } from "@/constants/theme";

const READ_KEY = "ecotrack-driver-notif-read";

type Filter = "all" | "unread" | "read";

export default function DriverNotificationsScreen() {
  const { profile } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<Filter>("all");

  const load = useCallback(async () => {
    const driverName = profile?.fullName ?? "Driver";
    const [schedules, announcements, route] = await Promise.all([
      fetchSchedules(),
      fetchAnnouncements(),
      fetchDriverRoute(driverName),
    ]);
    const mine = filterDriverSchedules(schedules, driverName);
    setItems(buildDriverNotifications(mine, announcements, route?.name));
    try {
      const raw = await AsyncStorage.getItem(READ_KEY);
      if (raw) setReadIds(new Set(JSON.parse(raw) as string[]));
    } catch {
      setReadIds(new Set());
    }
  }, [profile?.fullName]);

  useEffect(() => {
    load();
  }, [load]);

  async function markRead(id: string) {
    const next = new Set(readIds);
    next.add(id);
    setReadIds(next);
    await AsyncStorage.setItem(READ_KEY, JSON.stringify([...next]));
  }

  const filtered = items.filter((item) => {
    const isRead = readIds.has(item.id);
    if (filter === "unread") return !isRead;
    if (filter === "read") return isRead;
    return true;
  });

  const unreadCount = items.filter((i) => !readIds.has(i.id)).length;

  return (
    <View style={styles.screen}>
      <AppHeader title="Notifications" module="driver" showBell={false} />
      <View style={styles.tabs}>
        {(
          [
            ["all", `All (${items.length})`],
            ["unread", `Unread (${unreadCount})`],
            ["read", `Read (${items.length - unreadCount})`],
          ] as const
        ).map(([key, label]) => (
          <Pressable
            key={key}
            onPress={() => setFilter(key)}
            style={[styles.tab, filter === key && styles.tabActive]}
          >
            <Text style={[styles.tabText, filter === key && styles.tabTextActive]}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const isRead = readIds.has(item.id);
          return (
            <Pressable
              style={[styles.card, !isRead && styles.cardUnread]}
              onPress={() => markRead(item.id)}
            >
              <View style={styles.iconWrap}>
                <Ionicons name="notifications" size={20} color={colors.primary} />
              </View>
              <View style={styles.body}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.message}>{item.message}</Text>
                <Text style={styles.time}>{item.timestamp}</Text>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    tabs: {
      flexDirection: "row",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      gap: spacing.sm,
    },
    tab: {
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: radius.full,
    },
    tabActive: {
      borderBottomWidth: 2,
      borderBottomColor: colors.primary,
      borderRadius: 0,
    },
    tabText: {
      fontSize: fontSize.xs,
      color: colors.textMuted,
      fontWeight: "600",
    },
    tabTextActive: {
      color: colors.primary,
      fontWeight: "800",
    },
    list: { padding: spacing.md, gap: spacing.sm },
    card: {
      flexDirection: "row",
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    cardUnread: {
      backgroundColor: colors.primaryLight,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primaryLight,
      alignItems: "center",
      justifyContent: "center",
    },
    body: { flex: 1, gap: 4 },
    title: {
      fontWeight: "700",
      color: colors.text,
      fontSize: fontSize.sm,
    },
    message: {
      color: colors.textMuted,
      fontSize: fontSize.sm,
      lineHeight: 18,
    },
    time: {
      color: colors.textMuted,
      fontSize: fontSize.xs,
    },
  });
}
