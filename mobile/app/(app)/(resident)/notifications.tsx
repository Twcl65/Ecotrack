import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import AppHeader from "@/components/AppHeader";
import { useTheme } from "@/context/ThemeContext";
import { buildNotifications, type NotificationItem } from "@/lib/data/notifications";
import { fetchUserComplaints } from "@/lib/data/complaints";
import { fetchSchedules } from "@/lib/data/schedules";
import { useAuth } from "@/context/AuthContext";
import { fontSize, radius, spacing, type ThemeColors } from "@/constants/theme";

const READ_KEY = "ecotrack-resident-notif-read";

export default function NotificationsScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const profileName = profile?.fullName ?? "";
  const profilePhone = profile?.phone ?? "";
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const toneColors = useMemo(
    () => ({
      reminder: colors.warning,
      complaint: colors.info,
    }),
    [colors]
  );
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    try {
      const [[schedules, complaints], raw] = await Promise.all([
        Promise.all([
          fetchSchedules(),
          fetchUserComplaints(profileName, profilePhone, profile?.id),
        ]),
        AsyncStorage.getItem(READ_KEY),
      ]);
      setItems(buildNotifications(schedules, complaints));
      setReadIds(new Set(raw ? (JSON.parse(raw) as string[]) : []));
    } catch (error) {
      Alert.alert(
        "Could not load notifications",
        error instanceof Error ? error.message : "Please try again."
      );
    }
  }, [profile, profileName, profilePhone]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  async function openNotification(item: NotificationItem) {
    const next = new Set(readIds);
    next.add(item.id);
    setReadIds(next);
    try {
      await AsyncStorage.setItem(READ_KEY, JSON.stringify([...next]));
    } catch (error) {
      Alert.alert(
        "Could not save read status",
        error instanceof Error ? error.message : "The notification will still open."
      );
    }
    router.push({
      pathname: "/(app)/(resident)/notification-detail",
      params: {
        title: item.detailTitle ?? item.title,
        details: item.details,
        timestamp: item.timestamp,
      },
    } as never);
  }

  return (
    <View style={styles.screen}>
      <AppHeader title="Notification" showBack showBell={false} />
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No complaint or collection notifications right now.
          </Text>
        }
        renderItem={({ item }) => {
          const isRead = readIds.has(item.id);
          return (
            <Pressable
              accessibilityRole="button"
              style={[styles.card, !isRead && styles.cardUnread]}
              onPress={() => void openNotification(item)}
            >
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
              {!isRead ? <View style={styles.unreadDot} /> : null}
            </Pressable>
          );
        }}
      />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    list: { padding: spacing.md },
    empty: {
      color: colors.textMuted,
      fontSize: fontSize.sm,
      textAlign: "center",
      paddingVertical: spacing.xl,
    },
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
    cardUnread: {
      backgroundColor: colors.primaryLight,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      alignSelf: "center",
      backgroundColor: colors.primary,
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
