import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { getAnnouncementTypeConfig } from "@/lib/data/announcement-types";
import { fontSize, radius, type ThemeColors } from "@/constants/theme";

type Props = {
  type: string;
  colors: ThemeColors;
  size?: "sm" | "md";
};

export default function AnnouncementTypeIcon({
  type,
  colors,
  size = "md",
}: Props) {
  const config = getAnnouncementTypeConfig(type);
  const dim = size === "sm" ? 36 : 40;
  const iconSize = size === "sm" ? 18 : 22;
  const styles = useMemo(() => createStyles(colors, dim), [colors, dim]);

  return (
    <View style={[styles.wrap, { backgroundColor: config.bg(colors) }]}>
      <Ionicons name={config.icon} size={iconSize} color={config.color} />
    </View>
  );
}

export function AnnouncementTypeBadge({
  type,
  colors,
}: {
  type: string;
  colors: ThemeColors;
}) {
  const config = getAnnouncementTypeConfig(type);
  const styles = useMemo(() => createBadgeStyles(colors, config.color), [colors, config.color]);

  return (
    <View style={styles.badge}>
      <Ionicons name={config.icon} size={12} color={config.color} />
      <Text style={styles.label}>{config.label}</Text>
    </View>
  );
}

function createStyles(colors: ThemeColors, dim: number) {
  return StyleSheet.create({
    wrap: {
      width: dim,
      height: dim,
      borderRadius: dim / 2,
      alignItems: "center",
      justifyContent: "center",
    },
  });
}

function createBadgeStyles(colors: ThemeColors, accent: string) {
  return StyleSheet.create({
    badge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius.full,
      backgroundColor: `${accent}18`,
    },
    label: {
      fontSize: fontSize.xs,
      fontWeight: "700",
      color: accent,
    },
  });
}
