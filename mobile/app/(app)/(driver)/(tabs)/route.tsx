import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import AppHeader from "@/components/AppHeader";
import CollectionStatusBadge from "@/components/CollectionStatusBadge";
import RouteMapView from "@/components/RouteMapView";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import {
  getActiveSchedule,
  getCompletedTodaySchedules,
  getTodaySchedules,
} from "@/lib/data/driver";
import {
  fetchRouteForBarangay,
  getStopProgress,
  type DriverRoute,
} from "@/lib/data/routes";
import { fetchSchedules, formatTimeRange, type ScheduleItem } from "@/lib/data/schedules";
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

  const load = useCallback(async () => {
    const schedules = await fetchSchedules();
    const today = getTodaySchedules(schedules, driverName);
    const active = getActiveSchedule(today);
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
  }, [driverName]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const stopProgress = route ? getStopProgress(route.stops) : null;
  const routeFullyCollected =
    stopProgress != null &&
    stopProgress.total > 0 &&
    stopProgress.collected === stopProgress.total;

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
        {completedToday.map((schedule) => (
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
        ))}

        {activeSchedule && route ? (
          <>
            <View style={styles.scheduleCard}>
              <Text style={styles.scheduleLabel}>Current Collection</Text>
              <Text style={styles.scheduleBarangay}>{activeSchedule.barangay}</Text>
              <Text style={styles.scheduleTime}>
                {formatTimeRange(activeSchedule.timeStart, activeSchedule.timeEnd)}
              </Text>
              <CollectionStatusBadge status={activeSchedule.status} />
            </View>

            <RouteMapView stops={route.stops} height={260} />
            <Text style={styles.meta}>
              {route.routeCode} · {route.distanceKm.toFixed(1)} km · ~
              {Math.floor(route.estimatedMinutes / 60)}h {route.estimatedMinutes % 60}m
            </Text>
            <Text style={styles.sectionTitle}>Route Stops ({route.stops.length})</Text>
            {route.stops.map((stop) => (
              <View key={stop.id} style={styles.stopCard}>
                <View style={styles.stopNum}>
                  <Text style={styles.stopNumText}>{stop.stopOrder}</Text>
                </View>
                <Text style={styles.stopName}>{stop.name}</Text>
              </View>
            ))}

            {routeFullyCollected || activeSchedule.status === "completed" ? (
              <View style={styles.doneInline}>
                <Text style={styles.doneInlineText}>
                  Collection completed for {activeSchedule.barangay}
                </Text>
              </View>
            ) : (
              <Pressable style={styles.primaryBtn} onPress={openCollection}>
                <Text style={styles.primaryBtnText}>Start Collection</Text>
              </Pressable>
            )}
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
      fontSize: fontSize.lg,
      fontWeight: "800",
      color: colors.text,
    },
    scheduleTime: {
      color: colors.textMuted,
      fontSize: fontSize.sm,
      marginBottom: spacing.xs,
    },
    meta: {
      color: colors.textMuted,
      fontSize: fontSize.sm,
      fontWeight: "600",
    },
    sectionTitle: {
      fontSize: fontSize.md,
      fontWeight: "800",
      color: colors.text,
      marginTop: spacing.sm,
    },
    stopCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 10,
      paddingHorizontal: spacing.md,
    },
    stopNum: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    stopNumText: {
      color: colors.white,
      fontSize: fontSize.xs,
      fontWeight: "800",
    },
    stopName: {
      flex: 1,
      color: colors.text,
      fontWeight: "600",
      fontSize: fontSize.sm,
    },
    primaryBtn: {
      marginTop: spacing.md,
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
    doneInline: {
      marginTop: spacing.md,
      backgroundColor: colors.primaryLight,
      borderRadius: radius.md,
      padding: spacing.md,
      alignItems: "center",
    },
    doneInlineText: {
      color: colors.primary,
      fontWeight: "700",
      fontSize: fontSize.sm,
      textAlign: "center",
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
