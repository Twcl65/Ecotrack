import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AppHeader from "@/components/AppHeader";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import {
  fetchGarbageCollection,
  type GarbageCollectionRecord,
} from "@/lib/data/garbage";
import { exportGarbageExcel, exportGarbagePdf } from "@/lib/garbageExport";
import { fontSize, radius, spacing, type ThemeColors } from "@/constants/theme";

function formatPrice(value: number) {
  return `₱${value.toFixed(2)}`;
}

function formatDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function GarbageHistoryDetailScreen() {
  const { recordId } = useLocalSearchParams<{ recordId: string }>();
  const { session } = useAuth();
  const userId = session?.user.id;
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [record, setRecord] = useState<GarbageCollectionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRecord = useCallback(async () => {
    try {
      const request =
        recordId && userId
          ? fetchGarbageCollection(recordId, userId)
          : Promise.reject(
              new Error("This garbage collection record is unavailable.")
            );
      setRecord(await request);
      setError(null);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load collection details."
      );
    } finally {
      setLoading(false);
    }
  }, [recordId, userId]);

  useFocusEffect(
    useCallback(() => {
      void loadRecord();
    }, [loadRecord])
  );

  async function exportRecord(format: "pdf" | "excel") {
    if (!record) return;
    try {
      if (format === "pdf") await exportGarbagePdf(record);
      else await exportGarbageExcel(record);
    } catch (exportError) {
      Alert.alert(
        "Export failed",
        exportError instanceof Error
          ? exportError.message
          : "Could not export this record."
      );
    }
  }

  return (
    <View style={styles.screen}>
      <AppHeader title="Collection Details" module="driver" showBack />
      <ScrollView contentContainerStyle={styles.content}>
        {loading ? <ActivityIndicator color={colors.primary} /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {record ? (
          <>
            <View style={styles.scheduleCard}>
              <Text style={styles.scheduleLabel}>Collection schedule</Text>
              <Text style={styles.scheduleName}>{record.barangay}</Text>
              <Text style={styles.scheduleDate}>
                {formatDate(record.scheduleDate)}
              </Text>
            </View>

            <Text style={styles.sectionTitle}>Collected materials</Text>
            {record.materials.map((material) => (
              <View key={material.id} style={styles.materialCard}>
                <View style={styles.materialHeader}>
                  <View style={styles.materialNameWrap}>
                    <Text style={styles.materialName}>{material.name}</Text>
                    <Text style={styles.materialQuantity}>
                      {formatPrice(material.rate)} / {material.unit} -{" "}
                      {material.quantity} {material.unit} collected
                    </Text>
                  </View>
                  <Text style={styles.materialPrice}>
                    {formatPrice(material.price)}
                  </Text>
                </View>
              </View>
            ))}

            <View style={styles.totalCard}>
              <Text style={styles.totalLabel}>Total Price</Text>
              <Text style={styles.totalPrice}>
                {formatPrice(record.totalPrice)}
              </Text>
            </View>

            <Text style={styles.exportLabel}>Export this record</Text>
            <View style={styles.exportActions}>
              <Pressable
                onPress={() => void exportRecord("pdf")}
                style={styles.exportButton}
              >
                <Text style={styles.exportButtonText}>Export PDF</Text>
              </Pressable>
              <Pressable
                onPress={() => void exportRecord("excel")}
                style={styles.exportButton}
              >
                <Text style={styles.exportButtonText}>Export Excel</Text>
              </Pressable>
            </View>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
    scheduleCard: {
      gap: spacing.xs,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
    },
    scheduleLabel: {
      color: colors.textMuted,
      fontSize: fontSize.xs,
      fontWeight: "600",
    },
    scheduleName: {
      color: colors.text,
      fontSize: fontSize.lg,
      fontWeight: "800",
    },
    scheduleDate: { color: colors.textMuted, fontSize: fontSize.sm },
    sectionTitle: {
      color: colors.text,
      fontSize: fontSize.md,
      fontWeight: "800",
    },
    materialCard: {
      gap: spacing.xs,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
    },
    materialHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: spacing.sm,
    },
    materialNameWrap: { flex: 1, gap: 2 },
    materialName: {
      color: colors.text,
      fontSize: fontSize.md,
      fontWeight: "700",
    },
    materialQuantity: { color: colors.textMuted, fontSize: fontSize.xs },
    materialPrice: {
      color: colors.primary,
      fontSize: fontSize.md,
      fontWeight: "800",
    },
    totalCard: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.primary,
      backgroundColor: colors.primaryLight,
      padding: spacing.md,
    },
    totalLabel: {
      color: colors.text,
      fontSize: fontSize.md,
      fontWeight: "800",
    },
    totalPrice: {
      color: colors.primary,
      fontSize: fontSize.xl,
      fontWeight: "800",
    },
    exportLabel: {
      color: colors.textMuted,
      fontSize: fontSize.sm,
      fontWeight: "700",
    },
    exportActions: { flexDirection: "row", gap: spacing.sm },
    exportButton: {
      flex: 1,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      paddingVertical: spacing.md,
    },
    exportButtonText: {
      color: colors.primary,
      fontSize: fontSize.sm,
      fontWeight: "800",
    },
    error: { color: colors.danger, textAlign: "center" },
  });
}
