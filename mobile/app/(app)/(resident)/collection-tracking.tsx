import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
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
import { useTheme } from "@/context/ThemeContext";
import { fetchRouteById, fetchRouteForBarangay, type DriverRoute } from "@/lib/data/routes";
import { fetchSchedules, type ScheduleItem } from "@/lib/data/schedules";
import { fetchDriverLocation, type DriverLocation } from "@/lib/data/tracking";
import { supabase } from "@/lib/supabase";
import { fontSize, radius, spacing, type ThemeColors } from "@/constants/theme";

export default function CollectionTrackingScreen() {
  const { scheduleId } = useLocalSearchParams<{ scheduleId: string }>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [schedule, setSchedule] = useState<ScheduleItem | null>(null);
  const [route, setRoute] = useState<DriverRoute | null>(null);
  const [location, setLocation] = useState<DriverLocation | null>(null);
  const [now, setNow] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const updateTime = () => setNow(Date.now());
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  const load = useCallback(async () => {
    if (!scheduleId) {
      setError("Collection schedule is missing.");
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const items = await fetchSchedules(true);
      const selected = items.find((item) => item.id === scheduleId) ?? null;
      if (!selected) {
        setSchedule(null);
        setRoute(null);
        setLocation(null);
        setError("This collection schedule could not be found.");
        return;
      }

      setSchedule(selected);
      const driverName = selected.driver ?? "";
      const [routeData, locationData] = await Promise.all([
        selected.routeId
          ? fetchRouteById(selected.routeId, driverName)
          : fetchRouteForBarangay(selected.barangay, driverName),
        fetchDriverLocation(selected.id),
      ]);
      setRoute(routeData);
      setLocation(locationData);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load this collection.");
    } finally {
      setLoading(false);
    }
  }, [scheduleId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  useFocusEffect(
    useCallback(() => {
      if (!scheduleId) return;
      const channel = supabase
        .channel(`driver-location-${scheduleId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "driver_locations",
            filter: `schedule_id=eq.${scheduleId}`,
          },
          () => {
            void fetchDriverLocation(scheduleId)
              .then(setLocation)
              .catch((locationError: unknown) => {
                setError(
                  locationError instanceof Error
                    ? locationError.message
                    : "Could not refresh the driver location."
                );
              });
          }
        )
        .subscribe((status) => {
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            setError("Live updates are temporarily unavailable. Refresh to try again.");
          }
        });

      const fallbackRefresh = setInterval(() => {
        void fetchDriverLocation(scheduleId)
          .then(setLocation)
          .catch((locationError: unknown) => {
            setError(
              locationError instanceof Error
                ? locationError.message
                : "Could not refresh the driver location."
            );
          });
      }, 10000);

      return () => {
        clearInterval(fallbackRefresh);
        void supabase.removeChannel(channel);
      };
    }, [scheduleId])
  );

  const locationIsFresh =
    location !== null &&
    now !== null &&
    now - new Date(location.updatedAt).getTime() <= 30000;
  const isLive = Boolean(location?.isTracking && locationIsFresh);

  return (
    <View style={styles.screen}>
      <AppHeader title="Collection Tracking" showBack showBell={false} />
      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : schedule ? (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.scheduleCard}>
            <View style={styles.cardHeader}>
              <View style={styles.scheduleDetails}>
                <Text style={styles.barangay}>{schedule.barangay}</Text>
                <Text style={styles.date}>
                  {schedule.dateLabel} · {schedule.timeStart ?? "TBD"}
                  {schedule.timeEnd ? ` - ${schedule.timeEnd}` : ""}
                </Text>
                {schedule.driver ? (
                  <Text style={styles.driver}>Driver: {schedule.driver}</Text>
                ) : null}
              </View>
              <View style={[styles.statusPill, isLive ? styles.livePill : styles.waitingPill]}>
                <View style={[styles.statusDot, isLive ? styles.liveDot : styles.waitingDot]} />
                <Text style={[styles.statusText, isLive ? styles.liveText : styles.waitingText]}>
                  {isLive ? "LIVE" : schedule.status === "completed" ? "COMPLETED" : "WAITING"}
                </Text>
              </View>
            </View>
          </View>

          {route ? (
            <RouteMapView
              key={schedule.id}
              stops={route.stops}
              height={380}
              driverLocation={location}
            />
          ) : (
            <View style={styles.noRoute}>
              <Ionicons name="map-outline" size={30} color={colors.textMuted} />
              <Text style={styles.noRouteText}>
                The route map for this collection has not been assigned.
              </Text>
            </View>
          )}

          <View style={styles.locationInfo}>
            <Ionicons
              name={isLive ? "navigate-circle" : "time-outline"}
              size={22}
              color={isLive ? colors.primary : colors.textMuted}
            />
            <Text style={styles.locationMessage}>
              {isLive
                ? `Showing ${location?.driverName}'s current GPS location.`
                : location
                  ? `Last GPS update ${new Date(location.updatedAt).toLocaleTimeString()}. Waiting for the driver to share a fresh location.`
                  : "The driver location will appear here after the driver starts this collection and enables GPS."}
            </Text>
          </View>

          {route?.stops.length ? (
            <View style={styles.stopsCard}>
              <Text style={styles.stopsTitle}>Route Stops</Text>
              {route.stops.map((stop, index) => (
                <View key={stop.id} style={styles.stopRow}>
                  <Text style={styles.stopNumber}>{index + 1}</Text>
                  <Text style={styles.stopName}>{stop.name}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {error ? (
            <Text style={styles.error} accessibilityRole="alert">{error}</Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setLoading(true);
              void load();
            }}
            style={styles.refreshButton}
          >
            <Ionicons name="refresh" size={18} color={colors.primary} />
            <Text style={styles.refreshText}>Refresh collection</Text>
          </Pressable>
        </ScrollView>
      ) : (
        <Text style={styles.error}>{error ?? "Collection not found."}</Text>
      )}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    loader: { marginTop: spacing.xl },
    content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
    scheduleCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
    },
    cardHeader: { flexDirection: "row", justifyContent: "space-between", gap: spacing.sm },
    scheduleDetails: { flex: 1, gap: 4 },
    barangay: { color: colors.text, fontSize: fontSize.md, fontWeight: "800" },
    date: { color: colors.textMuted, fontSize: fontSize.sm },
    driver: { color: colors.textMuted, fontSize: fontSize.sm },
    statusPill: {
      height: 28,
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 9,
      borderRadius: 14,
    },
    livePill: { backgroundColor: "#dcfce7" },
    waitingPill: { backgroundColor: colors.background },
    statusDot: { width: 7, height: 7, borderRadius: 4 },
    liveDot: { backgroundColor: "#16a34a" },
    waitingDot: { backgroundColor: colors.textMuted },
    statusText: { fontSize: 10, fontWeight: "800" },
    liveText: { color: "#15803d" },
    waitingText: { color: colors.textMuted },
    noRoute: {
      height: 180,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
    },
    noRouteText: { color: colors.textMuted, textAlign: "center", fontSize: fontSize.sm },
    locationInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      padding: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
    },
    locationMessage: { flex: 1, color: colors.textMuted, fontSize: fontSize.sm, lineHeight: 20 },
    stopsCard: {
      padding: spacing.md,
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    stopsTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: "800" },
    stopRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    stopNumber: {
      width: 24,
      height: 24,
      borderRadius: 12,
      textAlign: "center",
      textAlignVertical: "center",
      color: colors.white,
      backgroundColor: colors.primary,
      overflow: "hidden",
      fontSize: fontSize.xs,
      fontWeight: "800",
    },
    stopName: { color: colors.text, fontSize: fontSize.sm },
    error: { color: colors.danger, fontSize: fontSize.sm, padding: spacing.md },
    refreshButton: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: spacing.xs,
      padding: spacing.sm,
    },
    refreshText: { color: colors.primary, fontWeight: "700", fontSize: fontSize.sm },
  });
}
