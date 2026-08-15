import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import AppHeader from "@/components/AppHeader";
import { useTheme } from "@/context/ThemeContext";
import { fetchAnnouncements } from "@/lib/data/announcements";
import { buildNotifications, type NotificationItem } from "@/lib/data/notifications";
import { fetchSchedules } from "@/lib/data/schedules";
import { fontSize, radius, spacing, type ThemeColors } from "@/constants/theme";

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const toneColors = useMemo(
    () => ({
      reminder: colors.warning,
      announcement: colors.info,
      holiday: colors.danger,
      thanks: colors.primary,
    }),
    [colors]
  );
  const [items, setItems] = useState<NotificationItem[]>([]);

  useEffect(() => {
    Promise.all([fetchSchedules(), fetchAnnouncements()]).then(
      ([schedules, announcements]) => {
        setItems(buildNotifications(schedules, announcements));
      }
    );
  }, []);

  return (
    <View style={styles.screen}>
      <AppHeader title="Notification" showBack showBell={false} />
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: `${toneColors[item.tone]}22` },
              ]}
            >
              <Ionicons
                name="notifications"
                size={20}
                color={toneColors[item.tone]}
              />
            </View>
            <View style={styles.body}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.message}>{item.message}</Text>
              <Text style={styles.time}>{item.timestamp}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    list: { padding: spacing.md },
    card: {
      flexDirection: "row",
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    body: { flex: 1, gap: 4 },
    title: {
      fontWeight: "700",
      color: colors.text,
      fontSize: fontSize.md,
    },
    message: {
      color: colors.textMuted,
      fontSize: fontSize.sm,
    },
    time: {
      alignSelf: "flex-end",
      color: colors.textMuted,
      fontSize: fontSize.xs,
    },
  });
}
