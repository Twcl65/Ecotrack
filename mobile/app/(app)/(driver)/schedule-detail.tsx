import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import AppHeader from "@/components/AppHeader";
import CollectionStatusBadge from "@/components/CollectionStatusBadge";
import { useTheme } from "@/context/ThemeContext";
import { fetchSchedules, formatTimeRange, type ScheduleItem } from "@/lib/data/schedules";
import { fontSize, radius, spacing, type ThemeColors } from "@/constants/theme";

export default function ScheduleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [item, setItem] = useState<ScheduleItem | null>(null);

  const load = useCallback(async () => {
    const all = await fetchSchedules();
    setItem(all.find((s) => s.id === id) ?? null);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!item) {
    return (
      <View style={styles.screen}>
        <AppHeader title="Schedule Details" showBack module="driver" showBell={false} />
        <Text style={styles.empty}>Schedule not found.</Text>
      </View>
    );
  }

  const isPending = item.status === "pending" || item.status === "ongoing";

  return (
    <View style={styles.screen}>
      <AppHeader title="Schedule Details" showBack module="driver" showBell={false} />
      <View style={styles.card}>
        <Text style={styles.barangay}>{item.barangay}</Text>
        <Text style={styles.time}>{formatTimeRange(item.timeStart, item.timeEnd)}</Text>
        <CollectionStatusBadge status={item.status} />
        <View style={styles.rows}>
          <Row label="Status" value={item.status} />
          <Row label="Date" value={item.dateLabel} />
          <Row label="Collection Time" value={formatTimeRange(item.timeStart, item.timeEnd)} />
          <Row label="Collector" value={item.driver ?? "Assigned driver"} />
          <Row
            label="Remarks"
            value={
              item.status === "completed"
                ? "All bins collected successfully."
                : "Tap 'View Route' to navigate."
            }
          />
        </View>
        {isPending ? (
          <Pressable style={styles.btn} onPress={() => router.push("/(app)/(driver)/route-nav" as never)}>
            <Text style={styles.btnText}>View Route</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ gap: 2 }}>
      <Text style={{ fontSize: 12, color: "#6b7280", fontWeight: "600" }}>{label}</Text>
      <Text style={{ fontSize: 14, color: "#1a1a1a", fontWeight: "600" }}>{value}</Text>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    card: {
      margin: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      gap: spacing.md,
    },
    barangay: {
      fontSize: fontSize.xl,
      fontWeight: "800",
      color: colors.text,
    },
    time: {
      color: colors.textMuted,
      fontSize: fontSize.sm,
    },
    rows: { gap: spacing.md },
    btn: {
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      alignItems: "center",
    },
    btnText: {
      color: colors.white,
      fontWeight: "800",
    },
    empty: {
      textAlign: "center",
      marginTop: spacing.xl,
      color: colors.textMuted,
    },
  });
}
