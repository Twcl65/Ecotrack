import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import AppHeader from "@/components/AppHeader";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { fontSize, radius, spacing, type ThemeColors } from "@/constants/theme";

export default function DriverProfileScreen() {
  const { profile } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const rows = [
    { label: "Full Name", value: profile?.fullName ?? "—" },
    { label: "Email", value: profile?.email ?? "—" },
    { label: "Username", value: profile?.username ?? "—" },
    { label: "Phone", value: profile?.phone || "Not set" },
    { label: "Role", value: "Driver" },
  ];

  return (
    <View style={styles.screen}>
      <AppHeader title="Profile" showBack module="driver" showBell={false} />
      <View style={styles.content}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color={colors.primary} />
          </View>
          <Text style={styles.role}>Driver</Text>
          <Text style={styles.name}>{profile?.fullName}</Text>
        </View>

        <View style={styles.card}>
          {rows.map((row) => (
            <View key={row.label} style={styles.row}>
              <Text style={styles.rowLabel}>{row.label}</Text>
              <Text style={styles.rowValue}>{row.value}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.note}>
          Password changes are managed through Supabase Auth. Contact your LGU
          administrator if you need help resetting your account.
        </Text>
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: {
      padding: spacing.md,
      gap: spacing.lg,
    },
    avatarWrap: {
      alignItems: "center",
      gap: spacing.sm,
    },
    avatar: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: colors.primaryLight,
      alignItems: "center",
      justifyContent: "center",
    },
    role: {
      color: colors.textMuted,
      fontSize: fontSize.sm,
      fontWeight: "600",
    },
    name: {
      fontSize: fontSize.xl,
      fontWeight: "800",
      color: colors.text,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    row: {
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 4,
    },
    rowLabel: {
      fontSize: fontSize.xs,
      color: colors.textMuted,
      fontWeight: "600",
      textTransform: "uppercase",
    },
    rowValue: {
      fontSize: fontSize.md,
      color: colors.text,
      fontWeight: "600",
    },
    note: {
      color: colors.textMuted,
      fontSize: fontSize.sm,
      lineHeight: 20,
      textAlign: "center",
    },
  });
}
