import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import AppHeader from "@/components/AppHeader";
import { useAuth } from "@/context/AuthContext";
import { useLogout } from "@/hooks/useLogout";
import { useTheme } from "@/context/ThemeContext";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";
import { fontSize, radius, spacing, type ThemeColors } from "@/constants/theme";

const MENU = [
  { icon: "megaphone-outline" as const, label: "Announcements", route: "/(app)/(driver)/announcements" },
  { icon: "notifications-outline" as const, label: "Notifications", route: "/(app)/(driver)/(tabs)/notifications" },
  { icon: "person-outline" as const, label: "Personal Information", route: "/(app)/(driver)/profile" },
  { icon: "lock-closed-outline" as const, label: "Change Password", route: "/(app)/(driver)/profile" },
  { icon: "settings-outline" as const, label: "App Settings", route: "/(app)/(driver)/settings" },
  { icon: "information-circle-outline" as const, label: "About ECOTRACK", route: "/(app)/(driver)/about" },
  { icon: "help-circle-outline" as const, label: "Help & Support", route: "/(app)/(driver)/help-support" },
];

export default function DriverMoreScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const { confirmLogout } = useLogout();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const unreadCounts = useUnreadCounts("driver");

  return (
    <View style={styles.screen}>
      <AppHeader module="driver" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            {profile?.avatarUrl ? (
              <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={36} color={colors.primary} />
            )}
          </View>
          <Text style={styles.role}>Driver</Text>
          <Text style={styles.name}>{profile?.fullName ?? "Driver"}</Text>
        </View>
        <View style={styles.menu}>
          {MENU.map((item) => {
            const badgeCount =
              item.label === "Announcements"
                ? unreadCounts.announcements
                : item.label === "Notifications"
                  ? unreadCounts.notifications
                  : 0;

            return (
              <Pressable
                key={item.label}
                style={styles.menuItem}
                onPress={() => router.push(item.route as never)}
              >
                <Ionicons name={item.icon} size={20} color={colors.primary} />
                <Text style={styles.menuLabel}>{item.label}</Text>
                {badgeCount > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {badgeCount > 99 ? "99+" : badgeCount}
                    </Text>
                  </View>
                ) : null}
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </Pressable>
            );
          })}
        </View>

        <Pressable
          style={styles.logout}
          onPress={confirmLogout}
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
    avatarImage: {
      width: "100%",
      height: "100%",
      borderRadius: 36,
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
    badge: {
      minWidth: 20,
      height: 20,
      paddingHorizontal: 5,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#dc2626",
    },
    badgeText: {
      color: colors.white,
      fontSize: 10,
      fontWeight: "800",
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
