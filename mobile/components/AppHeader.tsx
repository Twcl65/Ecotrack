import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HeaderLogo } from "@/components/Logo";
import { useTheme } from "@/context/ThemeContext";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";
import { fontSize, spacing, type ThemeColors } from "@/constants/theme";

type Props = {
  title?: string;
  showBack?: boolean;
  showBell?: boolean;
  module?: "resident" | "driver";
};

export default function AppHeader({
  title,
  showBack = false,
  showBell,
  module = "resident",
}: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const bellVisible = showBell ?? true;

  const notifRoute =
    module === "driver"
      ? "/(app)/(driver)/(tabs)/notifications"
      : "/(app)/(resident)/notifications";
  return (
    <View style={[styles.wrap, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.row}>
        <View style={styles.side}>
          {showBack ? (
            <Pressable onPress={() => router.back()} style={styles.iconBtn}>
              <Ionicons name="arrow-back" size={22} color={colors.headerText} />
            </Pressable>
          ) : (
            <View style={styles.iconBtn} />
          )}
        </View>

        <View style={styles.center}>
          {title ? (
            <Text style={styles.title}>{title}</Text>
          ) : (
            <HeaderLogo />
          )}
        </View>

        <View style={[styles.side, styles.sideRight]}>
          {!showBack && bellVisible ? (
            <NotificationBell module={module} route={notifRoute} />
          ) : (
            <View style={styles.iconBtn} />
          )}
        </View>
      </View>
    </View>
  );
}

function NotificationBell({
  module,
  route,
}: {
  module: "resident" | "driver";
  route: string;
}) {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const unreadCounts = useUnreadCounts(module);
  const unreadTotal = unreadCounts.notifications;

  return (
    <Pressable
      onPress={() => router.push(route as never)}
      style={[styles.iconBtn, styles.bellButton]}
      accessibilityRole="button"
      accessibilityLabel={`Notifications${unreadTotal ? `, ${unreadTotal} unread` : ""}`}
    >
      <Ionicons name="notifications-outline" size={22} color={colors.headerText} />
      {unreadTotal > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadTotal > 99 ? "99+" : unreadTotal}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      backgroundColor: colors.primaryDark,
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
    },
    side: {
      width: 40,
      alignItems: "flex-start",
    },
    sideRight: {
      alignItems: "flex-end",
    },
    iconBtn: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
    },
    bellButton: {
      position: "relative",
    },
    badge: {
      position: "absolute",
      top: -1,
      right: -3,
      minWidth: 17,
      height: 17,
      paddingHorizontal: 4,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#dc2626",
      borderWidth: 1,
      borderColor: colors.primaryDark,
    },
    badgeText: {
      color: colors.white,
      fontSize: 9,
      fontWeight: "800",
      lineHeight: 12,
    },
    center: {
      flex: 1,
      alignItems: "center",
    },
    title: {
      color: colors.headerText,
      fontSize: fontSize.lg,
      fontWeight: "700",
    },
  });
}
