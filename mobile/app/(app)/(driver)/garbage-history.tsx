import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AppHeader from "@/components/AppHeader";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import {
  fetchGarbageCollections,
  type GarbageCollectionRecord,
} from "@/lib/data/garbage";
import { fontSize, radius, spacing, type ThemeColors } from "@/constants/theme";

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10) === value;
}

function formatPrice(value: number) {
  return `₱${value.toFixed(2)}`;
}

function formatDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function GarbageHistoryScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.user.id;
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [records, setRecords] = useState<GarbageCollectionRecord[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [appliedRange, setAppliedRange] = useState({ fromDate: "", toDate: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRecords = useCallback(async () => {
    try {
      const request = userId
        ? fetchGarbageCollections(
          userId,
          appliedRange.fromDate || undefined,
          appliedRange.toDate || undefined
        )
        : Promise.reject(new Error("Sign in to view your collected garbage history."));
      const result = await request;
      setRecords(result);
      setError(null);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load collected garbage history."
      );
    } finally {
      setLoading(false);
    }
  }, [appliedRange, userId]);

  useFocusEffect(
    useCallback(() => {
      void loadRecords();
    }, [loadRecords])
  );

  function applyDateFilter() {
    if (fromDate && !isValidDate(fromDate)) {
      setError("Enter the start date in YYYY-MM-DD format.");
      return;
    }
    if (toDate && !isValidDate(toDate)) {
      setError("Enter the end date in YYYY-MM-DD format.");
      return;
    }
    if (fromDate && toDate && fromDate > toDate) {
      setError("The start date must be on or before the end date.");
      return;
    }
    setError(null);
    setLoading(true);
    setAppliedRange({ fromDate, toDate });
  }

  return (
    <View style={styles.screen}>
      <AppHeader title="Collected Garbage History" module="driver" showBack />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.filterCard}>
          <Text style={styles.filterTitle}>Filter by schedule date</Text>
          <View style={styles.dateFields}>
            <View style={styles.dateField}>
              <Text style={styles.label}>From</Text>
              <TextInput
                accessibilityLabel="Filter from schedule date"
                autoCapitalize="none"
                onChangeText={setFromDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                value={fromDate}
              />
            </View>
            <View style={styles.dateField}>
              <Text style={styles.label}>To</Text>
              <TextInput
                accessibilityLabel="Filter to schedule date"
                autoCapitalize="none"
                onChangeText={setToDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                value={toDate}
              />
            </View>
          </View>
          <Pressable onPress={applyDateFilter} style={styles.filterButton}>
            <Text style={styles.filterButtonText}>Apply date filter</Text>
          </Pressable>
        </View>

        {loading ? <ActivityIndicator color={colors.primary} /> : null}
        {error ? (
          <View style={styles.messageCard}>
            <Text style={styles.error}>{error}</Text>
            <Pressable
              onPress={() => {
                setLoading(true);
                void loadRecords();
              }}
            >
              <Text style={styles.retry}>Try again</Text>
            </Pressable>
          </View>
        ) : null}
        {!loading && !error && records.length === 0 ? (
          <View style={styles.messageCard}>
            <Ionicons
              name="file-tray-outline"
              size={28}
              color={colors.textMuted}
            />
            <Text style={styles.emptyTitle}>No saved collections</Text>
            <Text style={styles.emptyText}>
              Saved garbage records for this date range will appear here.
            </Text>
          </View>
        ) : null}
        {!loading
          ? records.map((record) => (
              <Pressable
                accessibilityRole="button"
                key={record.id}
                onPress={() =>
                  router.push({
                    pathname: "/(app)/(driver)/garbage-history-detail" as never,
                    params: { recordId: record.id },
                  })
                }
                style={styles.recordCard}
              >
                <View style={styles.recordIcon}>
                  <Ionicons
                    name="leaf-outline"
                    size={21}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.recordBody}>
                  <Text style={styles.recordSchedule}>{record.barangay}</Text>
                  <Text style={styles.recordDate}>
                    {formatDate(record.scheduleDate)} ·{" "}
                    {record.materials.length} material
                    {record.materials.length === 1 ? "" : "s"}
                  </Text>
                  <Text style={styles.recordTotal}>
                    {formatPrice(record.totalPrice)}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={19}
                  color={colors.textMuted}
                />
              </Pressable>
            ))
          : null}
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
    filterCard: {
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
    },
    filterTitle: {
      color: colors.text,
      fontSize: fontSize.md,
      fontWeight: "700",
    },
    dateFields: { flexDirection: "row", gap: spacing.sm },
    dateField: { flex: 1, gap: spacing.xs },
    label: {
      color: colors.textMuted,
      fontSize: fontSize.xs,
      fontWeight: "600",
    },
    input: {
      minWidth: 0,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      color: colors.text,
      backgroundColor: colors.background,
      paddingHorizontal: spacing.sm,
      paddingVertical: 11,
      fontSize: fontSize.sm,
    },
    filterButton: {
      alignItems: "center",
      borderRadius: radius.sm,
      backgroundColor: colors.primaryLight,
      paddingVertical: spacing.sm,
    },
    filterButtonText: {
      color: colors.primary,
      fontSize: fontSize.sm,
      fontWeight: "700",
    },
    recordCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
    },
    recordIcon: {
      width: 42,
      height: 42,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radius.full,
      backgroundColor: colors.primaryLight,
    },
    recordBody: { flex: 1, gap: 3 },
    recordSchedule: {
      color: colors.text,
      fontSize: fontSize.md,
      fontWeight: "700",
    },
    recordDate: { color: colors.textMuted, fontSize: fontSize.xs },
    recordTotal: {
      color: colors.primary,
      fontSize: fontSize.sm,
      fontWeight: "800",
    },
    messageCard: {
      alignItems: "center",
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
    },
    error: { color: colors.danger, textAlign: "center" },
    retry: { color: colors.primary, fontWeight: "700" },
    emptyTitle: {
      color: colors.text,
      fontSize: fontSize.md,
      fontWeight: "700",
    },
    emptyText: {
      color: colors.textMuted,
      fontSize: fontSize.sm,
      textAlign: "center",
    },
  });
}
