import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AppHeader from "@/components/AppHeader";
import CollectionStatusBadge from "@/components/CollectionStatusBadge";
import DriverStatCard from "@/components/DriverStatCard";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { fetchAnnouncements, type AnnouncementItem } from "@/lib/data/announcements";
import {
  computeDriverStats,
  filterDriverSchedules,
  getTodaySchedules,
  greeting,
} from "@/lib/data/driver";
import {
  fetchSchedules,
  formatTimeRange,
  type ScheduleItem,
} from "@/lib/data/schedules";
import { fontSize, radius, spacing, type ThemeColors } from "@/constants/theme";

export default function DriverDashboard() {
  const { profile } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [stats, setStats] = useState({ todayTotal: 0, completed: 0, pending: 0, inProgress: 0 });
  const [todaySchedules, setTodaySchedules] = useState<ScheduleItem[]>([]);
  const [latest, setLatest] = useState<AnnouncementItem | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const driverName = profile?.fullName ?? "Driver";
  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    []
  );

  const load = useCallback(async () => {
    const [schedules, announcements] = await Promise.all([
      fetchSchedules(),
      fetchAnnouncements(),
    ]);
    const mine = filterDriverSchedules(schedules, driverName);
    setStats(computeDriverStats(mine));
    setTodaySchedules(getTodaySchedules(schedules, driverName));
    setLatest(announcements[0] ?? null);
  }, [driverName]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={styles.screen}>
      <AppHeader module="driver" />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={async () => {
            setRefreshing(true);
            await load();
            setRefreshing(false);
          }} tintColor={colors.primary} />
        }
      >
        <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.hero}>
          <Text style={styles.heroGreeting}>
            {greeting()}, {driverName.split(" ")[0]}!
          </Text>
          <Text style={styles.heroRole}>Driver</Text>
        </LinearGradient>

        <View style={styles.statsGrid}>
          <DriverStatCard
            label="Today's Schedule"
            value={`${stats.todayTotal} Collection${stats.todayTotal === 1 ? "" : "s"}`}
            icon="calendar-outline"
          />
          <DriverStatCard
            label="Completed"
            value={`${stats.completed} Collection${stats.completed === 1 ? "" : "s"}`}
            icon="checkmark-circle-outline"
            tone="success"
          />
          <DriverStatCard
            label="Pending"
            value={`${stats.pending} Collection${stats.pending === 1 ? "" : "s"}`}
            icon="time-outline"
            tone="warning"
          />
          <DriverStatCard
            label="In-progress"
            value={`${stats.inProgress} Collection${stats.inProgress === 1 ? "" : "s"}`}
            icon="sync-outline"
            tone="info"
          />
        </View>

        {latest ? (
          <View style={styles.noticeCard}>
            <View style={styles.noticeHeader}>
              <Text style={styles.noticeTitle}>Latest Announcement</Text>
              <Pressable onPress={() => router.push("/(app)/(driver)/announcements" as never)}>
                <Text style={styles.viewAll}>View All</Text>
              </Pressable>
            </View>
            <Text style={styles.noticeHeading}>{latest.title}</Text>
            <Text style={styles.noticeBody} numberOfLines={3}>
              {latest.content}
            </Text>
            <Text style={styles.noticeDate}>{latest.dateLabel}</Text>
          </View>
        ) : null}

        <View style={styles.todaySection}>
          <View style={styles.todayHeader}>
            <Text style={styles.todayTitle}>Today&apos;s Collections</Text>
            <Text style={styles.todayDate}>{todayLabel}</Text>
          </View>
          {todaySchedules.length === 0 ? (
            <Text style={styles.todayEmpty}>No collections scheduled for today.</Text>
          ) : (
            todaySchedules.map((item) => (
              <Pressable
                key={item.id}
                style={styles.todayCard}
                onPress={() =>
                  router.push({
                    pathname: "/(app)/(driver)/schedule-detail" as never,
                    params: { id: item.id },
                  })
                }
              >
                <View style={styles.todayCardBody}>
                  <Text style={styles.todayBarangay}>{item.barangay}</Text>
                  <Text style={styles.todayTime}>
                    {formatTimeRange(item.timeStart, item.timeEnd)}
                  </Text>
                </View>
                <CollectionStatusBadge status={item.status} />
              </Pressable>
            ))
          )}
        </View>

        <Pressable
          style={styles.primaryBtn}
          onPress={() => router.push("/(app)/(driver)/(tabs)/route" as never)}
        >
          <Text style={styles.primaryBtnText}>View Route</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
    hero: {
      borderRadius: radius.lg,
      padding: spacing.lg,
      gap: 4,
    },
    heroGreeting: {
      color: colors.white,
      fontSize: fontSize.xl,
      fontWeight: "800",
    },
    heroRole: {
      color: "rgba(255,255,255,0.85)",
      fontSize: fontSize.sm,
      fontWeight: "600",
    },
    statsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    noticeCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      gap: spacing.sm,
    },
    noticeHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    noticeTitle: {
      fontWeight: "700",
      color: colors.textMuted,
      fontSize: fontSize.xs,
      textTransform: "uppercase",
    },
    viewAll: {
      color: colors.primary,
      fontSize: fontSize.xs,
      fontWeight: "700",
    },
    noticeHeading: {
      fontWeight: "700",
      color: colors.text,
      fontSize: fontSize.md,
    },
    noticeBody: {
      color: colors.textMuted,
      fontSize: fontSize.sm,
      lineHeight: 20,
    },
    noticeDate: {
      color: colors.textMuted,
      fontSize: fontSize.xs,
    },
    todaySection: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      gap: spacing.sm,
    },
    todayHeader: {
      gap: 2,
    },
    todayTitle: {
      fontWeight: "800",
      color: colors.text,
      fontSize: fontSize.md,
    },
    todayDate: {
      color: colors.textMuted,
      fontSize: fontSize.xs,
    },
    todayEmpty: {
      color: colors.textMuted,
      fontSize: fontSize.sm,
      textAlign: "center",
      paddingVertical: spacing.sm,
    },
    todayCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.background,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.sm,
      gap: spacing.sm,
    },
    todayCardBody: {
      flex: 1,
      gap: 2,
    },
    todayBarangay: {
      fontWeight: "700",
      color: colors.text,
      fontSize: fontSize.sm,
    },
    todayTime: {
      color: colors.textMuted,
      fontSize: fontSize.xs,
    },
    primaryBtn: {
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      alignItems: "center",
    },
    primaryBtnText: {
      color: colors.white,
      fontWeight: "800",
      fontSize: fontSize.md,
    },
  });
}
