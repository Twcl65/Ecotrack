import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Calendar } from "react-native-calendars";
import AppHeader from "@/components/AppHeader";
import CollectionStatusBadge from "@/components/CollectionStatusBadge";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { filterDriverSchedules } from "@/lib/data/driver";
import { fetchSchedules, formatTimeRange, type ScheduleItem } from "@/lib/data/schedules";
import { todayIso } from "@/lib/date";
import { fontSize, radius, spacing, type ThemeColors } from "@/constants/theme";

export default function DriverScheduleScreen() {
  const { profile } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [selectedDate, setSelectedDate] = useState(todayIso());

  const driverName = profile?.fullName ?? "Driver";

  const load = useCallback(async () => {
    const all = await fetchSchedules();
    setSchedules(filterDriverSchedules(all, driverName));
  }, [driverName]);

  useEffect(() => {
    load();
  }, [load]);

  const markedDates = useMemo(() => {
    const marks: Record<
      string,
      { marked?: boolean; dotColor?: string; selected?: boolean; selectedColor?: string }
    > = {};
    schedules.forEach((s) => {
      const dotColor =
        s.status === "completed"
          ? colors.primary
          : s.status === "ongoing"
            ? colors.info
            : colors.warning;
      marks[s.date] = { marked: true, dotColor };
    });
    marks[selectedDate] = {
      ...(marks[selectedDate] ?? {}),
      selected: true,
      selectedColor: colors.primary,
    };
    return marks;
  }, [schedules, selectedDate, colors]);

  const dayItems = schedules.filter((s) => s.date === selectedDate);

  return (
    <View style={styles.screen}>
      <AppHeader title="My Schedule" module="driver" />
      <Calendar
        current={selectedDate}
        onDayPress={(day: { dateString: string }) => setSelectedDate(day.dateString)}
        markedDates={markedDates}
        theme={{
          calendarBackground: colors.surface,
          dayTextColor: colors.text,
          monthTextColor: colors.text,
          textDisabledColor: colors.textMuted,
          todayTextColor: colors.primary,
          arrowColor: colors.primary,
          selectedDayBackgroundColor: colors.primary,
        }}
        style={styles.calendar}
      />
      <FlatList
        data={dayItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Text style={styles.listTitle}>Collections on selected date</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
              onPress={() =>
                router.push({
                  pathname: "/(app)/(driver)/schedule-detail" as never,
                  params: { id: item.id },
                })
              }
          >
            <View style={styles.cardBody}>
              <Text style={styles.cardBarangay}>{item.barangay}</Text>
              <Text style={styles.cardTime}>
                {formatTimeRange(item.timeStart, item.timeEnd)}
              </Text>
            </View>
            <CollectionStatusBadge status={item.status} />
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No collections scheduled for this date.</Text>
        }
      />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    calendar: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    list: { padding: spacing.md, gap: spacing.sm },
    listTitle: {
      fontSize: fontSize.md,
      fontWeight: "700",
      color: colors.text,
      marginBottom: spacing.sm,
    },
    card: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginBottom: spacing.sm,
      gap: spacing.sm,
    },
    cardBody: { flex: 1, gap: 2 },
    cardBarangay: {
      fontWeight: "700",
      color: colors.text,
      fontSize: fontSize.md,
    },
    cardTime: {
      color: colors.textMuted,
      fontSize: fontSize.sm,
    },
    empty: {
      textAlign: "center",
      color: colors.textMuted,
      paddingVertical: spacing.xl,
    },
  });
}
