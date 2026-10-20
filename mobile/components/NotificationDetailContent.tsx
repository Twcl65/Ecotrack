import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import AppHeader from "@/components/AppHeader";
import { useTheme } from "@/context/ThemeContext";
import { fontSize, radius, spacing, type ThemeColors } from "@/constants/theme";

type Props = {
  module: "resident" | "driver";
};

export default function NotificationDetailContent({ module }: Props) {
  const { title, details, timestamp } = useLocalSearchParams<{
    title?: string;
    details?: string;
    timestamp?: string;
  }>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.screen}>
      <AppHeader
        title="Notification Details"
        showBack
        module={module}
        showBell={false}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="notifications" size={36} color={colors.primary} />
        </View>
        <Text style={styles.title}>{title ?? "Notification"}</Text>
        {timestamp ? <Text style={styles.timestamp}>{timestamp}</Text> : null}
        <View style={styles.detailCard}>
          <Text style={styles.sectionTitle}>Details</Text>
          <Text style={styles.details}>{details ?? "No additional details."}</Text>
        </View>
        <View style={styles.readStatus}>
          <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
          <Text style={styles.readText}>Marked as read</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: {
      padding: spacing.lg,
      alignItems: "center",
      gap: spacing.md,
    },
    iconWrap: {
      width: 76,
      height: 76,
      borderRadius: 38,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primaryLight,
    },
    title: {
      color: colors.text,
      fontSize: fontSize.xl,
      fontWeight: "800",
      textAlign: "center",
    },
    timestamp: {
      color: colors.textMuted,
      fontSize: fontSize.sm,
    },
    detailCard: {
      alignSelf: "stretch",
      gap: spacing.sm,
      padding: spacing.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
    },
    sectionTitle: {
      color: colors.primary,
      fontSize: fontSize.sm,
      fontWeight: "700",
    },
    details: {
      color: colors.text,
      fontSize: fontSize.md,
      lineHeight: 23,
    },
    readStatus: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    readText: {
      color: colors.primary,
      fontSize: fontSize.sm,
      fontWeight: "700",
    },
  });
}
