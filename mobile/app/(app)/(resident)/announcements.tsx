import { useEffect, useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import AnnouncementTypeIcon from "@/components/AnnouncementTypeIcon";
import AppHeader from "@/components/AppHeader";
import { useTheme } from "@/context/ThemeContext";
import { fetchAnnouncements, type AnnouncementItem } from "@/lib/data/announcements";
import { getAnnouncementTypeConfig } from "@/lib/data/announcement-types";
import { fontSize, radius, spacing, type ThemeColors } from "@/constants/theme";

export default function AnnouncementsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [items, setItems] = useState<AnnouncementItem[]>([]);

  useEffect(() => {
    fetchAnnouncements().then(setItems);
  }, []);

  return (
    <View style={styles.screen}>
      <AppHeader title="Announcement" showBack showBell={false} />
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const typeConfig = getAnnouncementTypeConfig(item.type);
          return (
            <View style={styles.card}>
              <AnnouncementTypeIcon type={item.type} colors={colors} />
              <View style={styles.body}>
                <Text style={[styles.typeLabel, { color: typeConfig.color }]}>
                  {typeConfig.label}
                </Text>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.content}>{item.content}</Text>
                <Text style={styles.date}>{item.dateLabel}</Text>
              </View>
            </View>
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
    body: { flex: 1, gap: 6 },
    typeLabel: {
      fontSize: fontSize.xs,
      fontWeight: "700",
    },
    title: {
      fontWeight: "700",
      color: colors.text,
      fontSize: fontSize.md,
    },
    content: {
      color: colors.textMuted,
      fontSize: fontSize.sm,
      lineHeight: 20,
    },
    date: {
      alignSelf: "flex-end",
      color: colors.textMuted,
      fontSize: fontSize.xs,
    },
    empty: {
      textAlign: "center",
      color: colors.textMuted,
      paddingVertical: spacing.xl,
    },
  });
}
