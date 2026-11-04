import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AppHeader from "@/components/AppHeader";
import CollectionStatusBadge from "@/components/CollectionStatusBadge";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import {
  getActiveSchedule,
  getCompletedTodaySchedules,
  getNextUpcomingSchedule,
  getTodaySchedules,
} from "@/lib/data/driver";
import {
  formatRouteName,
  getRouteDirection,
  fetchRouteForBarangay,
  type DriverRoute,
} from "@/lib/data/routes";
import { fetchSchedules, formatTimeRange, type ScheduleItem } from "@/lib/data/schedules";
import { todayIso } from "@/lib/date";
import { fontSize, radius, spacing, type ThemeColors } from "@/constants/theme";

export default function DriverRouteScreen() {
  const { profile } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const driverName = profile?.fullName ?? "Driver";

  const [route, setRoute] = useState<DriverRoute | null>(null);
  const [activeSchedule, setActiveSchedule] = useState<ScheduleItem | null>(null);
  const [completedToday, setCompletedToday] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const schedules = await fetchSchedules(true);
      const today = getTodaySchedules(schedules, driverName);
      const active =
        getActiveSchedule(today) ?? getNextUpcomingSchedule(schedules, driverName);
      const completed = getCompletedTodaySchedules(today);

      setActiveSchedule(active);
      setCompletedToday(completed);

      if (active) {
        setRoute(await fetchRouteForBarangay(active.barangay, driverName));
      } else if (completed.length > 0) {
        const last = completed[completed.length - 1];
        setRoute(await fetchRouteForBarangay(last.barangay, driverName));
      } else {
        setRoute(null);
      }
    } catch (loadError) {
      setRoute(null);
      setActiveSchedule(null);
      setCompletedToday([]);
      setLoadError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load your route."
      );
    } finally {
      setLoading(false);
    }
  }, [driverName]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function openCollection() {
    if (!activeSchedule) return;
    router.push({
      pathname: "/(app)/(driver)/route-nav" as never,
      params: { scheduleId: activeSchedule.id },
    });
  }

  return (
    <View style={styles.screen}>
      <AppHeader title="My Route" module="driver" />
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable
          style={styles.historyBtn}
          onPress={() => router.push("/(app)/(driver)/route-history" as never)}
        >
          <Ionicons name="time-outline" size={18} color={colors.primary} />
          <Text style={styles.historyBtnText}>View Route History</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.primary} />
        </Pressable>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={styles.loading} />
        ) : null}
        {loadError ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{loadError}</Text>
            <Pressable onPress={() => void load()} style={styles.retryBtn}>
              <Text style={styles.retryText}>Try Again</Text>
            </Pressable>
          </View>
        ) : null}

        {!loading && !loadError ? completedToday.map((schedule) => (
          <View key={schedule.id} style={styles.completedBanner}>
            <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
            <View style={styles.completedBody}>
              <Text style={styles.completedTitle}>Collection Completed</Text>
              <Text style={styles.completedBarangay}>{schedule.barangay}</Text>
              <Text style={styles.completedTime}>
                {formatTimeRange(schedule.timeStart, schedule.timeEnd)}
              </Text>
            </View>
          </View>
        )) : null}

        {loading || loadError ? null : activeSchedule && route ? (
          <>
            <View style={styles.scheduleCard}>
              <Text style={styles.scheduleLabel}>
                {activeSchedule.date > todayIso()
                  ? "Upcoming Collection"
                  : "Today’s Collection"}
              </Text>
              <Text style={styles.scheduleBarangay}>
                {getRouteDirection(route, activeSchedule.barangay)} Jasaan -{" "}
                {formatRouteName(route.name)}
              </Text>
              <View style={styles.scheduleMetaRow}>
                <Text style={styles.scheduleTime}>
                  {formatTimeRange(activeSchedule.timeStart, activeSchedule.timeEnd)}
                </Text>
                <CollectionStatusBadge status={activeSchedule.status} />
              </View>
              <Text style={styles.scheduleTime}>{activeSchedule.dateLabel}</Text>
              <Pressable style={styles.primaryBtn} onPress={openCollection}>
                <Text style={styles.primaryBtnText}>View route</Text>
              </Pressable>
            </View>
          </>
        ) : completedToday.length > 0 ? (
          <Text style={styles.allDone}>
            All scheduled collections are completed for today.
          </Text>
        ) : (
          <Text style={styles.empty}>No collections scheduled for today.</Text>
        )}
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xl },
    loading: { marginVertical: spacing.xl },
    errorCard: {
      alignItems: "center",
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
    },
    errorText: {
      color: colors.danger,
      fontSize: fontSize.sm,
      textAlign: "center",
    },
    retryBtn: { padding: spacing.sm },
    retryText: { color: colors.primary, fontSize: fontSize.sm, fontWeight: "700" },
    completedBanner: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.sm,
      backgroundColor: colors.primaryLight,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.primary,
      padding: spacing.md,
    },
    completedBody: { flex: 1, gap: 2 },
    completedTitle: {
      fontWeight: "800",
      color: colors.primary,
      fontSize: fontSize.sm,
    },
    completedBarangay: {
      fontWeight: "700",
      color: colors.text,
      fontSize: fontSize.md,
    },
    completedTime: {
      color: colors.textMuted,
      fontSize: fontSize.xs,
    },
    scheduleCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      gap: 4,
    },
    scheduleLabel: {
      color: colors.textMuted,
      fontSize: fontSize.xs,
      fontWeight: "700",
      textTransform: "uppercase",
    },
    scheduleBarangay: {
      fontSize: fontSize.md,
      fontWeight: "800",
      color: colors.text,
    },
    scheduleMetaRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    scheduleTime: {
      color: colors.textMuted,
      fontSize: fontSize.sm,
      marginBottom: spacing.xs,
      flexShrink: 1,
    },
    primaryBtn: {
      marginTop: spacing.sm,
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
    historyBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
    },
    historyBtnText: {
      flex: 1,
      color: colors.primary,
      fontWeight: "700",
      fontSize: fontSize.sm,
    },
    allDone: {
      textAlign: "center",
      color: colors.textMuted,
      fontSize: fontSize.sm,
      paddingVertical: spacing.lg,
    },
    empty: {
      textAlign: "center",
      color: colors.textMuted,
      paddingVertical: spacing.xl,
    },
  });
}
