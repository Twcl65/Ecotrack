import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { fontSize, radius, spacing, type ThemeColors } from "@/constants/theme";

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  accent?: boolean;
};

export default function QuickAction({ icon, label, onPress, accent }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={[styles.iconWrap, accent && styles.iconAccent]}>
        <Ionicons
          name={icon}
          size={24}
          color={accent ? colors.danger : colors.primary}
        />
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
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
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.sm,
      alignItems: "center",
      gap: spacing.sm,
    },
    pressed: {
      opacity: 0.92,
    },
    iconWrap: {
      width: 52,
      height: 52,
      borderRadius: radius.md,
      backgroundColor: colors.primaryLight,
      alignItems: "center",
      justifyContent: "center",
    },
    iconAccent: {
      backgroundColor: `${colors.danger}22`,
    },
    label: {
      fontSize: fontSize.sm,
      fontWeight: "600",
      color: colors.text,
      textAlign: "center",
    },
  });
}
