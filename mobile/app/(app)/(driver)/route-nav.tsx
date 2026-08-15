import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AppHeader from "@/components/AppHeader";
import RouteMapView from "@/components/RouteMapView";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { completeSchedule, startSchedule } from "@/lib/data/collection";
import {
  getActiveSchedule,
  getTodaySchedules,
} from "@/lib/data/driver";
import {
  fetchRouteForBarangay,
  getNextStopIndex,
  getStopProgress,
  isStopCollected,
  markStopCollected,
  resetRouteStops,
  type DriverRoute,
  type RouteStopItem,
} from "@/lib/data/routes";
import { fetchSchedules, type ScheduleItem } from "@/lib/data/schedules";
import { fontSize, radius, spacing, type ThemeColors } from "@/constants/theme";

export default function RouteNavScreen() {
  const { profile } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const driverName = profile?.fullName ?? "Driver";
  const { scheduleId: scheduleIdParam } = useLocalSearchParams<{ scheduleId?: string }>();

  const [route, setRoute] = useState<DriverRoute | null>(null);
  const [schedule, setSchedule] = useState<ScheduleItem | null>(null);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const schedules = await fetchSchedules();
    const today = getTodaySchedules(schedules, driverName);
    const active =
      (scheduleIdParam
        ? today.find((s) => s.id === scheduleIdParam)
        : null) ?? getActiveSchedule(today);

    setSchedule(active ?? null);

    if (!active) {
      setRoute(null);
      return;
    }

    const data = await fetchRouteForBarangay(active.barangay, driverName);
    setRoute(data);

    if (data) {
      const progress = getStopProgress(data.stops);
      const done = progress.total > 0 && progress.collected === progress.total;
      setFinished(done || active.status === "completed");
      setStarted(active.status === "ongoing" || (progress.collected > 0 && !done));
    }
  }, [driverName, scheduleIdParam]);

  useEffect(() => {
    load();
  }, [load]);

  const stops = route?.stops ?? [];
  const progress = getStopProgress(stops);
  const nextIndex = getNextStopIndex(stops);
  const allCollected = stops.length > 0 && nextIndex === -1;

  async function handleStartCollection() {
    if (!schedule) return;
    setBusy(true);
    setError(null);
    const err = await startSchedule(schedule.id);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setStarted(true);
  }

  async function handleStopAction(stop: RouteStopItem, isLast: boolean) {
    if (!schedule || !route) return;
    setBusy(true);
    setError(null);

    const stopErr = await markStopCollected(stop.id);
    if (stopErr) {
      setBusy(false);
      setError(stopErr);
      return;
    }

    if (isLast) {
      const completeErr = await completeSchedule(schedule.id);
      if (completeErr) {
        setBusy(false);
        setError(completeErr);
        return;
      }
      const resetErr = await resetRouteStops(route.id);
      if (resetErr) {
        setBusy(false);
        setError(resetErr);
        return;
      }
      setFinished(true);
    }

    await load();
    setBusy(false);
  }

  const estLabel = route
    ? `${Math.floor(route.estimatedMinutes / 60)}h ${route.estimatedMinutes % 60}m (${route.distanceKm.toFixed(1)} km)`
    : "—";

  return (
    <View style={styles.screen}>
      <AppHeader title="Route Navigation" showBack module="driver" showBell={false} />
      <ScrollView contentContainerStyle={styles.content}>
        {route && schedule ? (
          <>
            <View style={styles.scheduleCard}>
              <Text style={styles.scheduleLabel}>Collecting</Text>
              <Text style={styles.scheduleBarangay}>{schedule.barangay}</Text>
            </View>

            <RouteMapView stops={stops} height={260} />

            <Text style={styles.estTitle}>Estimated Time</Text>
            <Text style={styles.estValue}>{estLabel}</Text>

            {!started && !finished && !allCollected ? (
              <>
                {stops[0] ? (
                  <Text style={styles.startEnd}>
                    Start: {stops[0].name} → End: {stops[stops.length - 1]?.name}
                  </Text>
                ) : null}
                <Pressable
                  style={[styles.primaryBtn, busy && styles.btnDisabled]}
                  onPress={handleStartCollection}
                  disabled={busy || stops.length === 0}
                >
                  {busy ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <Text style={styles.primaryBtnText}>Start Collection</Text>
                  )}
                </Pressable>
              </>
            ) : (
              <>
                <View style={styles.progressCard}>
                  <Text style={styles.progressTitle}>Collection Progress</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${progress.percent}%` }]} />
                  </View>
                  <Text style={styles.progressSub}>
                    {progress.collected} of {progress.total} stops collected
                  </Text>
                </View>

                <Text style={styles.sectionTitle}>Route Stops</Text>
                {stops.map((stop, index) => {
                  const collected = isStopCollected(stop.status);
                  const isNext = index === nextIndex;
                  const isLast = index === stops.length - 1;
                  const canAct = started && isNext && !finished && !busy;

                  return (
                    <View
                      key={stop.id}
                      style={[
                        styles.stopCard,
                        collected && styles.stopCardDone,
                        isNext && !collected && styles.stopCardActive,
                      ]}
                    >
                      <View style={[styles.stopNum, collected && styles.stopNumDone]}>
                        {collected ? (
                          <Ionicons name="checkmark" size={14} color={colors.white} />
                        ) : (
                          <Text style={styles.stopNumText}>{stop.stopOrder}</Text>
                        )}
                      </View>
                      <View style={styles.stopBody}>
                        <Text style={styles.stopName}>{stop.name}</Text>
                        {stop.description ? (
                          <Text style={styles.stopDesc}>{stop.description}</Text>
                        ) : null}
                        {collected ? (
                          <Text style={styles.collectedLabel}>Collected</Text>
                        ) : canAct ? (
                          <Pressable
                            style={[
                              styles.actionBtn,
                              isLast && styles.completeBtn,
                            ]}
                            onPress={() => handleStopAction(stop, isLast)}
                          >
                            <Text style={styles.actionBtnText}>
                              {isLast ? "Collection Completed" : "Mark as Collected"}
                            </Text>
                          </Pressable>
                        ) : isNext && !started ? (
                          <Text style={styles.waitHint}>Tap Start Collection above</Text>
                        ) : null}
                      </View>
                    </View>
                  );
                })}

                {finished || allCollected ? (
                  <View style={styles.doneBanner}>
                    <Ionicons name="checkmark-circle" size={28} color={colors.primary} />
                    <Text style={styles.doneTitle}>Collection Completed</Text>
                    <Text style={styles.doneSub}>
                      Collection completed for {schedule.barangay}. Go back to My Route for
                      your next collection.
                    </Text>
                  </View>
                ) : null}
              </>
            )}

            {error ? <Text style={styles.error}>{error}</Text> : null}
          </>
        ) : (
          <Text style={styles.empty}>No collection scheduled for this route.</Text>
        )}
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
    scheduleCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      gap: 2,
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
    estTitle: {
      color: colors.textMuted,
      fontSize: fontSize.sm,
      fontWeight: "600",
    },
    estValue: {
      fontSize: fontSize.lg,
      fontWeight: "800",
      color: colors.text,
    },
    startEnd: {
      color: colors.textMuted,
      fontSize: fontSize.sm,
    },
    primaryBtn: {
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      alignItems: "center",
    },
    btnDisabled: {
      opacity: 0.7,
    },
    primaryBtnText: {
      color: colors.white,
      fontWeight: "800",
      fontSize: fontSize.md,
    },
    progressCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      gap: spacing.sm,
    },
    progressTitle: {
      fontWeight: "800",
      color: colors.text,
      fontSize: fontSize.md,
    },
    barTrack: {
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.border,
      overflow: "hidden",
    },
    barFill: {
      height: "100%",
      backgroundColor: colors.primary,
      borderRadius: 4,
    },
    progressSub: {
      color: colors.textMuted,
      fontSize: fontSize.sm,
    },
    sectionTitle: {
      fontSize: fontSize.md,
      fontWeight: "800",
      color: colors.text,
    },
    stopCard: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
    },
    stopCardActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryLight,
    },
    stopCardDone: {
      opacity: 0.85,
    },
    stopNum: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 2,
    },
    stopNumDone: {
      backgroundColor: colors.primaryDark,
    },
    stopNumText: {
      color: colors.white,
      fontSize: fontSize.xs,
      fontWeight: "800",
    },
    stopBody: {
      flex: 1,
      gap: 4,
    },
    stopName: {
      fontWeight: "700",
      color: colors.text,
      fontSize: fontSize.sm,
    },
    stopDesc: {
      color: colors.textMuted,
      fontSize: fontSize.xs,
    },
    collectedLabel: {
      color: colors.primary,
      fontSize: fontSize.xs,
      fontWeight: "700",
      marginTop: 4,
    },
    waitHint: {
      color: colors.textMuted,
      fontSize: fontSize.xs,
      fontStyle: "italic",
      marginTop: 4,
    },
    actionBtn: {
      alignSelf: "flex-start",
      marginTop: spacing.sm,
      backgroundColor: colors.primary,
      borderRadius: radius.sm,
      paddingVertical: 8,
      paddingHorizontal: spacing.md,
    },
    completeBtn: {
      backgroundColor: colors.primaryDark,
    },
    actionBtnText: {
      color: colors.white,
      fontWeight: "700",
      fontSize: fontSize.sm,
    },
    doneBanner: {
      alignItems: "center",
      gap: spacing.sm,
      backgroundColor: colors.primaryLight,
      borderRadius: radius.md,
      padding: spacing.lg,
    },
    doneTitle: {
      fontWeight: "800",
      color: colors.primary,
      fontSize: fontSize.lg,
    },
    doneSub: {
      textAlign: "center",
      color: colors.textMuted,
      fontSize: fontSize.sm,
    },
    error: {
      color: colors.danger,
      fontSize: fontSize.sm,
      backgroundColor: "#fef2f2",
      padding: spacing.sm,
      borderRadius: radius.sm,
    },
    empty: {
      textAlign: "center",
      color: colors.textMuted,
      paddingVertical: spacing.xl,
    },
  });
}
