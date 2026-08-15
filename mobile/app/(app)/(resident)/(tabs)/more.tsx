import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import AppHeader from "@/components/AppHeader";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { fontSize, radius, spacing, type ThemeColors } from "@/constants/theme";

const MENU_ITEMS = [
  {
    icon: "person-outline" as const,
    label: "Personal Information",
    route: "/(app)/(resident)/profile",
  },
  {
    icon: "lock-closed-outline" as const,
    label: "Change Password",
    route: "/(app)/(resident)/profile",
  },
  {
    icon: "settings-outline" as const,
    label: "App Settings",
    route: "/(app)/(resident)/settings",
  },
  {
    icon: "information-circle-outline" as const,
    label: "About ECOTRACK",
    route: "/(app)/(resident)/about",
  },
  {
    icon: "help-circle-outline" as const,
    label: "Help & Support",
    route: "/(app)/(resident)/help-support",
  },
];

export default function MoreScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.screen}>
      <AppHeader />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={36} color={colors.primary} />
          </View>
          <Text style={styles.role}>Resident</Text>
          <Text style={styles.name}>{profile?.fullName ?? "Resident"}</Text>
        </View>

        <View style={styles.menu}>
          {MENU_ITEMS.map((item) => (
            <Pressable
              key={item.label}
              style={styles.menuItem}
              onPress={() => router.push(item.route as never)}
            >
              <Ionicons name={item.icon} size={20} color={colors.primary} />
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
          ))}
        </View>

        <Pressable
          style={styles.logout}
          onPress={() => router.push("/(app)/(resident)/logout" as never)}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md, gap: spacing.md, paddingBottom: 100 },
    profileCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      padding: spacing.lg,
      gap: 4,
    },
    avatar: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.primaryLight,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.sm,
    },
    role: {
      color: colors.textMuted,
      fontSize: fontSize.sm,
      fontWeight: "600",
    },
    name: {
      fontSize: fontSize.lg,
      fontWeight: "800",
      color: colors.text,
    },
    menu: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    menuLabel: {
      flex: 1,
      fontWeight: "600",
      color: colors.text,
      fontSize: fontSize.md,
    },
    logout: {
      alignItems: "center",
      paddingVertical: spacing.md,
    },
    logoutText: {
      color: colors.primary,
      fontWeight: "800",
      fontSize: fontSize.md,
    },
  });
}
