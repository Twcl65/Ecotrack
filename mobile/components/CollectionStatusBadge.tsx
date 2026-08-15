import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { fontSize, radius, type ThemeColors } from "@/constants/theme";

type Props = { status: string };

export default function CollectionStatusBadge({ status }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const normalized = status.toLowerCase();
  let label = "Pending";
  let bg = "#fef3c7";
  let fg = "#b45309";

  if (normalized === "completed") {
    label = "Completed";
    bg = colors.primaryLight;
    fg = colors.primary;
  } else if (normalized === "ongoing") {
    label = "In Progress";
    bg = "#dbeafe";
    fg = colors.info;
  } else if (normalized === "canceled") {
    label = "Cancelled";
    bg = "#fee2e2";
    fg = colors.danger;
  }

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: fg }]}>{label}</Text>
    </View>
  );
}

function createStyles(_colors: ThemeColors) {
  return StyleSheet.create({
    badge: {
      borderRadius: radius.full,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    text: {
      fontSize: fontSize.xs,
      fontWeight: "700",
    },
  });
}
