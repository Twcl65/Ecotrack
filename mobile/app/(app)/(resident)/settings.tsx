import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import AppHeader from "@/components/AppHeader";
import { useTheme } from "@/context/ThemeContext";
import { fontSize, radius, spacing, type ThemeColors } from "@/constants/theme";

export default function SettingsScreen() {
  const { mode, setMode, colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.screen}>
      <AppHeader title="App Settings" showBack showBell={false} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <Text style={styles.sectionHint}>Choose how ECOTRACK looks on your device.</Text>

        <View style={styles.themeRow}>
          <ThemeOption
            label="Light"
            icon="sunny-outline"
            selected={mode === "light"}
            onPress={() => setMode("light")}
            colors={colors}
          />
          <ThemeOption
            label="Dark"
            icon="moon-outline"
            selected={mode === "dark"}
            onPress={() => setMode("dark")}
            colors={colors}
          />
        </View>

        <View style={styles.previewCard}>
          <View style={styles.previewHeader}>
            <Ionicons name="leaf" size={16} color={colors.white} />
            <Text style={styles.previewHeaderText}>Preview</Text>
          </View>
          <View style={styles.previewBody}>
            <Text style={styles.previewTitle}>ECOTRACK</Text>
            <Text style={styles.previewText}>
              {mode === "dark"
                ? "Dark mode reduces glare in low-light environments."
                : "Light mode keeps the classic clean ECOTRACK look."}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function ThemeOption({
  label,
  icon,
  selected,
  onPress,
  colors,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onPress: () => void;
  colors: ThemeColors;
}) {
  const styles = useMemo(() => createOptionStyles(colors), [colors]);

  return (
    <Pressable
      style={[styles.option, selected && styles.optionSelected]}
      onPress={onPress}
    >
      <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
        <Ionicons
          name={icon}
          size={22}
          color={selected ? colors.primary : colors.textMuted}
        />
      </View>
      <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
        {label}
      </Text>
      {selected ? (
        <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
      ) : null}
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: {
      padding: spacing.md,
      gap: spacing.md,
      paddingBottom: spacing.xl,
    },
    sectionTitle: {
      fontSize: fontSize.lg,
      fontWeight: "800",
      color: colors.text,
    },
    sectionHint: {
      color: colors.textMuted,
      fontSize: fontSize.sm,
      marginTop: -spacing.sm,
    },
    themeRow: {
      gap: spacing.sm,
    },
    previewCard: {
      borderRadius: radius.lg,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
    },
    previewHeader: {
      backgroundColor: colors.primary,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      padding: spacing.md,
    },
    previewHeaderText: {
      color: colors.white,
      fontWeight: "700",
    },
    previewBody: {
      backgroundColor: colors.surface,
      padding: spacing.md,
      gap: spacing.sm,
    },
    previewTitle: {
      color: colors.text,
      fontWeight: "800",
      fontSize: fontSize.md,
    },
    previewText: {
      color: colors.textMuted,
      fontSize: fontSize.sm,
      lineHeight: 20,
    },
  });
}

function createOptionStyles(colors: ThemeColors) {
  return StyleSheet.create({
    option: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.md,
    },
    optionSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryLight,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
    },
    iconWrapSelected: {
      backgroundColor: colors.surface,
    },
    optionLabel: {
      flex: 1,
      fontSize: fontSize.md,
      fontWeight: "600",
      color: colors.text,
    },
    optionLabelSelected: {
      color: colors.primary,
      fontWeight: "800",
    },
  });
}
