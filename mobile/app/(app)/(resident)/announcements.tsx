import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import AnnouncementTypeIcon from "@/components/AnnouncementTypeIcon";
import AppHeader from "@/components/AppHeader";
import { useTheme } from "@/context/ThemeContext";
import { fetchAnnouncements, type AnnouncementItem } from "@/lib/data/announcements";
import { getAnnouncementTypeConfig } from "@/lib/data/announcement-types";
import { fontSize, radius, spacing, type ThemeColors } from "@/constants/theme";

const READ_KEY = "ecotrack-resident-ann-read";
type Filter = "all" | "unread" | "read";

export default function ResidentAnnouncementsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [items, setItems] = useState<AnnouncementItem[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<Filter>("all");

  const load = useCallback(async () => {
    const announcements = await fetchAnnouncements();
    setItems(announcements);
    try {
      const raw = await AsyncStorage.getItem(READ_KEY);
      setReadIds(new Set(raw ? (JSON.parse(raw) as string[]) : []));
    } catch (error) {
      Alert.alert(
        "Could not load announcement read status",
        error instanceof Error ? error.message : "Please try again."
      );
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const filtered = items.filter((item) => {
    const isRead = readIds.has(item.id);
    if (filter === "unread") return !isRead;
    if (filter === "read") return isRead;
    return true;
  });
  const unreadCount = items.filter((item) => !readIds.has(item.id)).length;

  return (
    <View style={styles.screen}>
      <AppHeader title="Announcements" showBack showBell={false} />
      <View style={styles.tabs}>
        {(
          [
            ["all", "All"],
            ["unread", `Unread (${unreadCount})`],
            ["read", `Read (${items.length - unreadCount})`],
          ] as const
        ).map(([key, label]) => (
          <Pressable
            key={key}
            onPress={() => setFilter(key)}
            style={[styles.tab, filter === key && styles.tabActive]}
          >
            <Text style={[styles.tabText, filter === key && styles.tabTextActive]}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const typeConfig = getAnnouncementTypeConfig(item.type);
          const isRead = readIds.has(item.id);
          return (
            <Pressable
              accessibilityRole="button"
              style={[styles.card, !isRead && styles.cardUnread]}
              onPress={() =>
                router.push({
                  pathname: "/(app)/(resident)/announcement-detail",
                  params: { id: item.id },
                } as never)
              }
            >
              <AnnouncementTypeIcon type={item.type} colors={colors} />
              <View style={styles.body}>
                <Text style={[styles.typeLabel, { color: typeConfig.color }]}>
                  {typeConfig.label}
                </Text>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.content} numberOfLines={2}>
                  {item.content}
                </Text>
                <Text style={styles.date}>{item.dateLabel}</Text>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>No announcements at this time.</Text>
        }
      />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    tabs: {
      flexDirection: "row",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      gap: spacing.lg,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tab: { paddingVertical: spacing.sm, borderBottomWidth: 2, borderBottomColor: "transparent" },
    tabActive: { borderBottomColor: colors.primary },
    tabText: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: "600" },
    tabTextActive: { color: colors.primary, fontWeight: "800" },
    list: { padding: spacing.md, gap: spacing.sm },
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
    cardUnread: { borderColor: colors.primary },
    body: { flex: 1, gap: 6 },
    typeLabel: { fontSize: fontSize.xs, fontWeight: "700" },
    title: { fontWeight: "700", color: colors.text, fontSize: fontSize.md },
    content: { color: colors.textMuted, fontSize: fontSize.sm, lineHeight: 20 },
    date: { alignSelf: "flex-end", color: colors.textMuted, fontSize: fontSize.xs },
    empty: {
      textAlign: "center",
      color: colors.textMuted,
      paddingVertical: spacing.xl,
    },
  });
}
