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
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { filterDriverSchedules } from "@/lib/data/driver";
import {
  fetchSchedules,
  formatTimeRange,
  type ScheduleItem,
} from "@/lib/data/schedules";
import { fontSize, radius, spacing, type ThemeColors } from "@/constants/theme";

export default function DriverRouteHistoryScreen() {
  const { profile } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const driverName = profile?.fullName ?? "Driver";
  const [history, setHistory] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const schedules = await fetchSchedules(true);
      setHistory(
        filterDriverSchedules(schedules, driverName)
          .filter((schedule) => schedule.status === "completed")
          .sort((a, b) =>
            b.date.localeCompare(a.date) ||
            (b.timeStart ?? "").localeCompare(a.timeStart ?? "")
          )
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load route history."
      );
    } finally {
      setLoading(false);
    }
  }, [driverName]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  return (
    <View style={styles.screen}>
      <AppHeader title="Route History" showBack module="driver" showBell={false} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.intro}>
          Your completed collection routes, newest first.
        </Text>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={styles.loading} />
        ) : error ? (
          <View style={styles.messageCard}>
            <Text style={styles.error}>{error}</Text>
            <Pressable onPress={() => void load()} style={styles.retryBtn}>
              <Text style={styles.retryText}>Try Again</Text>
            </Pressable>
          </View>
        ) : history.length === 0 ? (
          <View style={styles.messageCard}>
            <Ionicons name="time-outline" size={28} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No route history yet</Text>
            <Text style={styles.emptyText}>
              Completed collections will appear here.
            </Text>
          </View>
        ) : (
          history.map((schedule) => (
            <View key={schedule.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconWrap}>
                  <Ionicons name="checkmark" size={18} color={colors.primary} />
                </View>
                <View style={styles.cardTitleWrap}>
                  <Text style={styles.barangay}>{schedule.barangay}</Text>
                  <Text style={styles.date}>{schedule.dateLabel}</Text>
                </View>
                <Text style={styles.completed}>Completed</Text>
              </View>
              <Text style={styles.time}>
                {formatTimeRange(schedule.timeStart, schedule.timeEnd)}
              </Text>
              <Pressable
                style={styles.viewBtn}
                onPress={() =>
                  router.push({
                    pathname: "/(app)/(driver)/route-nav" as never,
                    params: { scheduleId: schedule.id, history: "true" },
                  })
                }
                accessibilityRole="button"
                accessibilityLabel={`View route for ${schedule.barangay} on ${schedule.dateLabel}`}
              >
                <Ionicons name="map-outline" size={17} color={colors.white} />
                <Text style={styles.viewBtnText}>View Route</Text>
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
    intro: { color: colors.textMuted, fontSize: fontSize.sm },
    loading: { marginTop: spacing.xl },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      gap: spacing.sm,
    },
    cardHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    iconWrap: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primaryLight,
    },
    cardTitleWrap: { flex: 1, gap: 2 },
    barangay: { color: colors.text, fontSize: fontSize.md, fontWeight: "800" },
    date: { color: colors.textMuted, fontSize: fontSize.xs },
    completed: { color: colors.primary, fontSize: fontSize.xs, fontWeight: "700" },
    time: { color: colors.textMuted, fontSize: fontSize.sm, marginLeft: 42 },
    viewBtn: {
      minHeight: 44,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      marginTop: spacing.xs,
    },
    viewBtnText: { color: colors.white, fontWeight: "700", fontSize: fontSize.sm },
    messageCard: {
      alignItems: "center",
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
    },
    emptyTitle: { color: colors.text, fontWeight: "700", fontSize: fontSize.md },
    emptyText: { color: colors.textMuted, textAlign: "center", fontSize: fontSize.sm },
    error: { color: colors.danger, textAlign: "center", fontSize: fontSize.sm },
    retryBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
    retryText: { color: colors.primary, fontWeight: "700", fontSize: fontSize.sm },
  });
}
