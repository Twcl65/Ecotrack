import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { fontSize, radius, spacing, type ThemeColors } from "@/constants/theme";

type Props = {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone?: "default" | "success" | "warning" | "info";
};

export default function DriverStatCard({
  label,
  value,
  icon,
  tone = "default",
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const iconColor =
    tone === "success"
      ? colors.primary
      : tone === "warning"
        ? colors.warning
        : tone === "info"
          ? colors.info
          : colors.textMuted;

  return (
    <View style={styles.card}>
      <Ionicons name={icon} size={18} color={iconColor} />
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      flex: 1,
      minWidth: "45%",
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      gap: 4,
    },
    value: {
      fontSize: fontSize.lg,
      fontWeight: "800",
      color: colors.text,
    },
    label: {
      fontSize: fontSize.xs,
      color: colors.textMuted,
      fontWeight: "600",
    },
  });
}
