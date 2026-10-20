import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import * as Location from "expo-location";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  getNextUpcomingSchedule,
  getTodaySchedules,
  filterDriverSchedules,
} from "@/lib/data/driver";
import {
  formatRouteName,
  fetchRouteForBarangay,
  getRouteDirection,
  getNextStopIndex,
  getStopProgress,
  isStopNearLocationPath,
  isStopCollected,
  markStopCollected,
  resetRouteStops,
  type DriverRoute,
  type RouteStopItem,
} from "@/lib/data/routes";
import { fetchSchedules, type ScheduleItem } from "@/lib/data/schedules";
import { publishDriverLocation, stopDriverLocationTracking } from "@/lib/data/tracking";
import { todayIso } from "@/lib/date";
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
  const [gpsStatus, setGpsStatus] = useState<string | null>(null);
  const routeRef = useRef<DriverRoute | null>(null);
  const previousGpsPosition = useRef<Location.LocationObjectCoords | null>(null);
  const processingStop = useRef(false);

  const load = useCallback(async () => {
    const schedules = await fetchSchedules();
    const assigned = filterDriverSchedules(schedules, driverName);
    const today = getTodaySchedules(schedules, driverName);
    const active =
      (scheduleIdParam
        ? assigned.find((s) => s.id === scheduleIdParam)
        : null) ??
      getActiveSchedule(today) ??
      getNextUpcomingSchedule(schedules, driverName);

    setSchedule(active ?? null);

    if (!active) {
      setRoute(null);
      routeRef.current = null;
      setStarted(false);
      setFinished(false);
      return;
    }

    const data = await fetchRouteForBarangay(active.barangay, driverName);
    setRoute(data);
    routeRef.current = data;

    if (data) {
      const progress = getStopProgress(data.stops);
      const done = progress.total > 0 && progress.collected === progress.total;
      setFinished(done || active.status === "completed");
      setStarted(
        active.status === "ongoing" ||
          (progress.collected > 0 && !done)
      );
    } else {
      setStarted(false);
      setFinished(active.status === "completed");
    }
  }, [driverName, scheduleIdParam]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  useEffect(() => {
    if (!schedule?.id || !profile?.id || !started || finished) return;
    const scheduleId = schedule.id;
    const driverId = profile.id;
    let active = true;
    let subscription: Location.LocationSubscription | null = null;
    previousGpsPosition.current = null;

    async function markPassedStops(
      position: Location.LocationObjectCoords
    ): Promise<void> {
      if (processingStop.current) return;
      const previous = previousGpsPosition.current;
      previousGpsPosition.current = position;
      const loadedRoute = routeRef.current;
      if (!loadedRoute || !previous) return;
      let currentRoute: DriverRoute = loadedRoute;

      processingStop.current = true;
      try {
        while (active) {
          const nextStopIndex = getNextStopIndex(currentRoute.stops);
          const nextStop: RouteStopItem | undefined =
            currentRoute.stops[nextStopIndex];
          if (
            !nextStop ||
            !isStopNearLocationPath(nextStop, previous, position)
          ) {
            return;
          }

          const stopError = await markStopCollected(nextStop.id);
          if (stopError) throw new Error(`Could not mark ${nextStop.name} collected: ${stopError}`);

          currentRoute = {
            ...currentRoute,
            stops: currentRoute.stops.map((stop): RouteStopItem =>
              stop.id === nextStop.id ? { ...stop, status: "completed" } : stop
            ),
          };
          routeRef.current = currentRoute;
          setRoute(currentRoute);
          setGpsStatus(`Passed ${nextStop.name}. Stop marked collected.`);

          if (getNextStopIndex(currentRoute.stops) !== -1) continue;

          const completionError = await completeSchedule(scheduleId);
          if (completionError) {
            throw new Error(`All stops were reached, but the collection could not be completed: ${completionError}`);
          }

          setFinished(true);
          const trackingError = await stopDriverLocationTracking(scheduleId);
          if (trackingError) {
            throw new Error(`Collection completed, but GPS tracking could not be stopped: ${trackingError}`);
          }

          const resetError = await resetRouteStops(currentRoute.id);
          if (resetError) {
            throw new Error(`Collection completed, but route stops could not be reset: ${resetError}`);
          }

          await load();
          return;
        }
      } catch (stopError) {
        if (active) {
          setError(stopError instanceof Error ? stopError.message : "Could not update collection progress.");
        }
      } finally {
        processingStop.current = false;
      }
    }

    async function beginGpsTracking() {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!permission.granted) {
          if (active) setGpsStatus("Location permission is disabled. Enable it to share your live location.");
          return;
        }

        const servicesEnabled = await Location.hasServicesEnabledAsync();
        if (!servicesEnabled) {
          if (active) setGpsStatus("Turn on device location to share live tracking.");
          return;
        }

        if (active) setGpsStatus("Getting GPS location...");
        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          async (position) => {
            if (!active) return;
            try {
              const publishError = await publishDriverLocation({
                scheduleId,
                driverId,
                driverName,
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                isTracking: true,
              });
              if (active) {
                setGpsStatus(
                  publishError
                    ? `GPS is active, but location could not be shared: ${publishError}`
                    : "Live GPS tracking is on."
                );
              }
              await markPassedStops(position.coords);
            } catch (publishError) {
              if (active) {
                setGpsStatus(
                  publishError instanceof Error
                    ? `GPS is active, but location could not be shared: ${publishError.message}`
                    : "GPS is active, but location could not be shared."
                );
              }
            }
          }
        );
      } catch (trackingError) {
        if (active) {
          setGpsStatus(
            trackingError instanceof Error
              ? `GPS tracking could not start: ${trackingError.message}`
              : "GPS tracking could not start."
          );
        }
      }
    }

    void beginGpsTracking();
    return () => {
      active = false;
      subscription?.remove();
    };
  }, [driverName, finished, load, profile?.id, schedule?.id, started]);

  const stops = route?.stops ?? [];
  const progress = getStopProgress(stops);
  const nextIndex = getNextStopIndex(stops);
  const allCollected = stops.length > 0 && nextIndex === -1;
  const canStartCollection =
    schedule != null &&
    schedule.date <= todayIso() &&
    (schedule.status === "pending" || schedule.status === "ongoing");

  async function handleStartCollection() {
    if (!schedule) return;
    setBusy(true);
    setError(null);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setError("Allow location access to start a tracked collection.");
        return;
      }
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setError("Turn on device location to start a tracked collection.");
        return;
      }
      const err = await startSchedule(schedule.id);
      if (err) {
        setError(err);
        return;
      }
      setSchedule({ ...schedule, status: "ongoing" });
      setStarted(true);
    } catch (startError) {
      setError(
        startError instanceof Error ? startError.message : "Could not start collection."
      );
    } finally {
      setBusy(false);
    }
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
              <Text style={styles.scheduleLabel}>
                {schedule.date > todayIso() ? "Upcoming Collection" : "Today’s Collection"}
              </Text>
              <Text style={styles.scheduleBarangay}>
                {getRouteDirection(route, schedule.barangay)} Jasaan
              </Text>
              <Text style={styles.scheduleRoute}>{formatRouteName(route.name)}</Text>
              <Text style={styles.scheduleRoute}>{schedule.barangay}</Text>
              <Text style={styles.scheduleDate}>{schedule.dateLabel}</Text>
            </View>

            <RouteMapView stops={stops} height={260} />
            {started && gpsStatus ? (
              <Text style={styles.gpsStatus}>{gpsStatus}</Text>
            ) : null}

            <Text style={styles.estTitle}>Estimated Time</Text>
            <Text style={styles.estValue}>{estLabel}</Text>

            {!started && !finished && !allCollected ? (
              <>
                {stops[0] ? (
                  <View style={styles.endpointList}>
                    <Text style={styles.endpointTitle}>Route stops</Text>
                    {stops.map((stop, index) => (
                      <View key={stop.id} style={styles.endpointRow}>
                        <Text style={styles.endpointBullet}>{"\u2022"}</Text>
                        <Text style={styles.startEnd}>
                          {index === 0
                            ? `Start: ${stop.name}`
                            : index === stops.length - 1
                              ? `End: ${stop.name}`
                              : stop.name}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : null}
                {canStartCollection ? (
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
                ) : (
                  <Text style={styles.waitHint}>
                    This collection is scheduled for {schedule.dateLabel}. You can view the route now.
                  </Text>
                )}
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
                        ) : isNext && started ? (
                          <Text style={styles.waitHint}>
                            This stop will be marked collected automatically when the vehicle passes it.
                          </Text>
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
    scheduleDate: {
      color: colors.textMuted,
      fontSize: fontSize.sm,
    },
    scheduleRoute: {
      color: colors.textMuted,
      fontSize: fontSize.sm,
      fontWeight: "600",
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
    endpointList: {
      gap: spacing.xs,
    },
    endpointTitle: {
      color: colors.text,
      fontSize: fontSize.sm,
      fontWeight: "700",
    },
    endpointRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.xs,
    },
    endpointBullet: {
      color: colors.textMuted,
      fontSize: fontSize.md,
      lineHeight: 20,
    },
    startEnd: {
      color: colors.textMuted,
      fontSize: fontSize.sm,
      flex: 1,
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
    gpsStatus: {
      color: colors.textMuted,
      fontSize: fontSize.xs,
      textAlign: "center",
    },
    empty: {
      textAlign: "center",
      color: colors.textMuted,
      paddingVertical: spacing.xl,
    },
  });
}
