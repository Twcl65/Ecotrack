import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import AnnouncementTypeIcon, { AnnouncementTypeBadge } from "@/components/AnnouncementTypeIcon";
import AppHeader from "@/components/AppHeader";
import QuickAction from "@/components/QuickAction";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { fetchAnnouncements, type AnnouncementItem } from "@/lib/data/announcements";
import {
  fetchSchedules,
  getNextCollection,
  type ScheduleItem,
} from "@/lib/data/schedules";
import { fontSize, radius, spacing, type ThemeColors } from "@/constants/theme";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function ResidentDashboard() {
  const { profile } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [nextCollection, setNextCollection] = useState<ScheduleItem | null>(null);
  const [latestAnnouncement, setLatestAnnouncement] = useState<AnnouncementItem | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [schedules, announcements] = await Promise.all([
      fetchSchedules(),
      fetchAnnouncements(),
    ]);
    setNextCollection(getNextCollection(schedules));
    setLatestAnnouncement(announcements[0] ?? null);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <View style={styles.screen}>
      <AppHeader />
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <Text style={styles.greeting}>
          {greeting()}, {profile?.fullName?.split(" ")[0] ?? "Resident"}!
        </Text>

        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          style={styles.nextCard}
        >
          <View style={styles.nextTextWrap}>
            <Text style={styles.nextLabel}>Next Collection</Text>
            <Text style={styles.nextDate}>
              {nextCollection
                ? `${nextCollection.dateLabel} (${nextCollection.dayLabel})`
                : "No upcoming schedule"}
            </Text>
            <Text style={styles.nextBarangay}>
              {nextCollection?.barangay ?? "Check schedule for updates"}
            </Text>
          </View>
        </LinearGradient>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickGrid}>
          <QuickAction
            icon="calendar-outline"
            label="Collection Schedule"
            onPress={() => router.push("/(app)/(resident)/(tabs)/schedule")}
          />
          <QuickAction
            icon="create-outline"
            label="Submit Complaint"
            onPress={() => router.push("/(app)/(resident)/(tabs)/complaint")}
          />
          <QuickAction
            icon="megaphone-outline"
            label="Announcement"
            onPress={() => router.push("/(app)/(resident)/announcements")}
          />
          <QuickAction
            icon="notifications-outline"
            label="Notification"
            accent
            onPress={() => router.push("/(app)/(resident)/notifications")}
          />
        </View>

        {latestAnnouncement ? (
          <View style={styles.noticeCard}>
            <View style={styles.noticeHeader}>
              <AnnouncementTypeIcon type={latestAnnouncement.type} colors={colors} size="sm" />
              <Text style={styles.noticeTitle}>Latest Announcement</Text>
              <AnnouncementTypeBadge type={latestAnnouncement.type} colors={colors} />
            </View>
            <Text style={styles.announcementHeading}>{latestAnnouncement.title}</Text>
            <Text style={styles.noticeBody}>{latestAnnouncement.content}</Text>
            <Text style={styles.noticeDate}>{latestAnnouncement.dateLabel}</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    body: { flex: 1 },
    content: {
      padding: spacing.md,
      gap: spacing.md,
      paddingBottom: spacing.xl,
    },
    greeting: {
      fontSize: fontSize.xl,
      fontWeight: "800",
      color: colors.text,
    },
    nextCard: {
      borderRadius: radius.lg,
      padding: spacing.lg,
      overflow: "hidden",
    },
    nextTextWrap: { gap: 4 },
    nextLabel: {
      color: "rgba(255,255,255,0.85)",
      fontSize: fontSize.sm,
      fontWeight: "600",
    },
    nextDate: {
      color: colors.white,
      fontSize: fontSize.lg,
      fontWeight: "800",
    },
    nextBarangay: {
      color: "rgba(255,255,255,0.9)",
      fontSize: fontSize.sm,
    },
    sectionTitle: {
      fontSize: fontSize.md,
      fontWeight: "700",
      color: colors.text,
    },
    quickGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    noticeCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      gap: spacing.sm,
    },
    noticeHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    noticeTitle: {
      flex: 1,
      fontWeight: "700",
      color: colors.textMuted,
      fontSize: fontSize.xs,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    announcementHeading: {
      fontWeight: "700",
      color: colors.text,
      fontSize: fontSize.md,
    },
    noticeBody: {
      color: colors.textMuted,
      fontSize: fontSize.sm,
      lineHeight: 20,
    },
    noticeDate: {
      color: colors.textMuted,
      fontSize: fontSize.xs,
      marginTop: 2,
    },
  });
}
