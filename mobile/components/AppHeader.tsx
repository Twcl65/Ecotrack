import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HeaderLogo } from "@/components/Logo";
import { useTheme } from "@/context/ThemeContext";
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
  const bellVisible = showBell ?? module !== "driver";

  const notifRoute =
    module === "driver"
      ? "/(app)/(driver)/(tabs)/notifications"
      : "/(app)/(resident)/notifications";
  const announceRoute =
    module === "driver"
      ? "/(app)/(driver)/announcements"
      : "/(app)/(resident)/announcements";

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.row}>
        <View style={styles.side}>
          {showBack ? (
            <Pressable onPress={() => router.back()} style={styles.iconBtn}>
              <Ionicons name="arrow-back" size={22} color={colors.headerText} />
            </Pressable>
          ) : (
            <Pressable
              onPress={() => router.push(announceRoute as never)}
              style={styles.iconBtn}
              accessibilityLabel="Announcements"
            >
              <Ionicons name="megaphone-outline" size={22} color={colors.headerText} />
            </Pressable>
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
            <Pressable
              onPress={() => router.push(notifRoute as never)}
              style={styles.iconBtn}
              accessibilityLabel="Notifications"
            >
              <Ionicons name="notifications-outline" size={22} color={colors.headerText} />
            </Pressable>
          ) : (
            <View style={styles.iconBtn} />
          )}
        </View>
      </View>
    </View>
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
