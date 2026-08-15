import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import AnnouncementTypeIcon from "@/components/AnnouncementTypeIcon";
import AppHeader from "@/components/AppHeader";
import { useTheme } from "@/context/ThemeContext";
import { fetchAnnouncements, type AnnouncementItem } from "@/lib/data/announcements";
import { getAnnouncementTypeConfig } from "@/lib/data/announcement-types";
import { fontSize, radius, spacing, type ThemeColors } from "@/constants/theme";

const READ_KEY = "ecotrack-driver-ann-read";

export default function DriverAnnouncementDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [item, setItem] = useState<AnnouncementItem | null>(null);
  const [read, setRead] = useState(false);

  const load = useCallback(async () => {
    const all = await fetchAnnouncements();
    const found = all.find((a) => a.id === id) ?? null;
    setItem(found);
    try {
      const raw = await AsyncStorage.getItem(READ_KEY);
      const ids = raw ? (JSON.parse(raw) as string[]) : [];
      setRead(ids.includes(id));
    } catch {
      setRead(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function markRead() {
    try {
      const raw = await AsyncStorage.getItem(READ_KEY);
      const ids = raw ? (JSON.parse(raw) as string[]) : [];
      if (!ids.includes(id)) {
        ids.push(id);
        await AsyncStorage.setItem(READ_KEY, JSON.stringify(ids));
      }
      setRead(true);
    } catch {
      setRead(true);
    }
  }

  if (!item) {
    return (
      <View style={styles.screen}>
        <AppHeader title="Announcement Details" showBack module="driver" showBell={false} />
        <Text style={styles.empty}>Announcement not found.</Text>
      </View>
    );
  }

  const typeConfig = getAnnouncementTypeConfig(item.type);

  return (
    <View style={styles.screen}>
      <AppHeader title="Announcement Details" showBack module="driver" showBell={false} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconWrap}>
          <AnnouncementTypeIcon type={item.type} colors={colors} size="md" />
        </View>
        <Text style={styles.title}>{item.title}</Text>
        <View style={styles.tag}>
          <Text style={styles.tagText}>{typeConfig.label}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
          <Text style={styles.meta}>{item.dateLabel}</Text>
        </View>
        <Text style={styles.messageLabel}>Message</Text>
        <View style={styles.messageCard}>
          <Text style={styles.message}>{item.content}</Text>
        </View>
        {!read ? (
          <Pressable style={styles.btn} onPress={markRead}>
            <Ionicons name="checkmark-circle-outline" size={20} color={colors.white} />
            <Text style={styles.btnText}>Mark as Read</Text>
          </Pressable>
        ) : (
          <Text style={styles.readNote}>Marked as read</Text>
        )}
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: {
      padding: spacing.lg,
      gap: spacing.md,
      paddingBottom: spacing.xl,
      alignItems: "center",
    },
    iconWrap: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontSize: fontSize.xl,
      fontWeight: "800",
      color: colors.text,
      textAlign: "center",
    },
    tag: {
      backgroundColor: colors.primaryLight,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: radius.full,
    },
    tagText: {
      color: colors.primary,
      fontSize: fontSize.xs,
      fontWeight: "700",
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    meta: {
      color: colors.textMuted,
      fontSize: fontSize.sm,
    },
    messageLabel: {
      alignSelf: "flex-start",
      color: colors.primary,
      fontWeight: "700",
      fontSize: fontSize.sm,
    },
    messageCard: {
      alignSelf: "stretch",
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
    },
    message: {
      color: colors.text,
      fontSize: fontSize.sm,
      lineHeight: 22,
    },
    btn: {
      alignSelf: "stretch",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      marginTop: spacing.sm,
    },
    btnText: {
      color: colors.white,
      fontWeight: "800",
      fontSize: fontSize.md,
    },
    readNote: {
      color: colors.textMuted,
      fontSize: fontSize.sm,
      fontWeight: "600",
    },
    empty: {
      textAlign: "center",
      marginTop: spacing.xl,
      color: colors.textMuted,
    },
  });
}
