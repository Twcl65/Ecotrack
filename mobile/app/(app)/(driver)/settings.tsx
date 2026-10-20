import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import AppHeader from "@/components/AppHeader";
import { useTheme } from "@/context/ThemeContext";
import { fontSize, radius, spacing, type ThemeColors } from "@/constants/theme";

export default function DriverSettingsScreen() {
  const { mode, setMode, colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.screen}>
      <AppHeader title="Settings" showBack module="driver" showBell={false} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.group}>
          <SettingsRow label="Language" value="English" />
          <ToggleRow label="Push Notifications" defaultOn colors={colors} />
          <ToggleRow label="Data Saver" defaultOn={false} colors={colors} />
          <ToggleRow label="Auto Sync" defaultOn colors={colors} />
        </View>

        <Text style={styles.sectionTitle}>Appearance</Text>
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

        <View style={styles.group}>
          <SettingsRow label="App Version" value="1.0.0" showChevron={false} />
          <SettingsRow label="Latest Update" value="April 20, 2024" showChevron={false} />
        </View>
      </ScrollView>
    </View>
  );
}

function SettingsRow({
  label,
  value,
  showChevron = true,
}: {
  label: string;
  value: string;
  showChevron?: boolean;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createRowStyles(colors), [colors]);

  return (
    <View style={styles.row}>
      <View style={styles.rowBody}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
      {showChevron ? (
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      ) : null}
    </View>
  );
}

function ToggleRow({
  label,
  defaultOn,
  colors,
}: {
  label: string;
  defaultOn: boolean;
  colors: ThemeColors;
}) {
  const styles = useMemo(() => createRowStyles(colors), [colors]);

  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { flex: 1 }]}>{label}</Text>
      <Switch
        value={defaultOn}
        trackColor={{ false: colors.border, true: colors.primaryLight }}
        thumbColor={defaultOn ? colors.primary : colors.textMuted}
      />
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
  return (
    <Pressable
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        backgroundColor: selected ? colors.primaryLight : colors.surface,
        borderWidth: 1,
        borderColor: selected ? colors.primary : colors.border,
        borderRadius: radius.md,
        padding: spacing.md,
      }}
      onPress={onPress}
    >
      <Ionicons
        name={icon}
        size={22}
        color={selected ? colors.primary : colors.textMuted}
      />
      <Text
        style={{
          flex: 1,
          fontWeight: selected ? "800" : "600",
          color: selected ? colors.primary : colors.text,
        }}
      >
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
    group: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    sectionTitle: {
      fontSize: fontSize.md,
      fontWeight: "800",
      color: colors.text,
    },
    themeRow: { gap: spacing.sm },
  });
}

function createRowStyles(colors: ThemeColors) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: spacing.sm,
    },
    rowBody: { flex: 1, gap: 2 },
    rowLabel: {
      fontSize: fontSize.md,
      fontWeight: "600",
      color: colors.text,
    },
    rowValue: {
      fontSize: fontSize.sm,
      color: colors.textMuted,
    },
  });
}
