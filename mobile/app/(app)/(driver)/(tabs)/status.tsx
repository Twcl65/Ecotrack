import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AppHeader from "@/components/AppHeader";
import CollectionStatusBadge from "@/components/CollectionStatusBadge";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import {
  computeCollectionProgress,
  filterDriverSchedules,
} from "@/lib/data/driver";
import { fetchSchedules, formatTimeRange, type ScheduleItem } from "@/lib/data/schedules";
import { todayIso } from "@/lib/date";
import { fontSize, radius, spacing, type ThemeColors } from "@/constants/theme";

export default function DriverStatusScreen() {
  const { profile } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const load = useCallback(async () => {
    const all = await fetchSchedules();
    setSchedules(filterDriverSchedules(all, profile?.fullName ?? "Driver"));
  }, [profile?.fullName]);

  useEffect(() => {
    load();
  }, [load]);

  const progress = computeCollectionProgress(schedules);
  const todayItems = schedules.filter((s) => s.date === todayIso());

  return (
    <View style={styles.screen}>
      <AppHeader title="Collection Status" module="driver" />
      <FlatList
        data={todayItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.progressCard}>
            <Text style={styles.progressDate}>Today, {todayLabel}</Text>
            <Text style={styles.progressLabel}>Progress</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${progress.percent}%` }]} />
            </View>
            <Text style={styles.progressSub}>
              {progress.completed} of {progress.total} collections completed
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Ionicons
              name={
                item.status === "completed"
                  ? "checkmark-circle"
                  : item.status === "ongoing"
                    ? "sync-circle"
                    : "time-outline"
              }
              size={22}
              color={
                item.status === "completed"
                  ? colors.primary
                  : item.status === "ongoing"
                    ? colors.info
                    : colors.warning
              }
            />
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{item.barangay}</Text>
              <Text style={styles.cardTime}>
                {formatTimeRange(item.timeStart, item.timeEnd)}
              </Text>
            </View>
            <CollectionStatusBadge status={item.status} />
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No collections scheduled for today.</Text>
        }
      />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    list: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xl },
    progressCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    progressDate: {
      fontWeight: "800",
      color: colors.text,
      fontSize: fontSize.md,
    },
    progressLabel: {
      color: colors.textMuted,
      fontSize: fontSize.sm,
      fontWeight: "600",
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
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    cardBody: { flex: 1, gap: 2 },
    cardTitle: {
      fontWeight: "700",
      color: colors.text,
      fontSize: fontSize.md,
    },
    cardTime: {
      color: colors.textMuted,
      fontSize: fontSize.sm,
    },
    empty: {
      textAlign: "center",
      color: colors.textMuted,
      paddingVertical: spacing.xl,
    },
  });
}
