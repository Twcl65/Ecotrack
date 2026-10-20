import { useCallback, useMemo, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Calendar } from "react-native-calendars";
import AppHeader from "@/components/AppHeader";
import { useTheme } from "@/context/ThemeContext";
import { fetchHolidays, type HolidayItem } from "@/lib/data/announcements";
import {
  fetchSchedules,
  formatTimeRange,
  type ScheduleItem,
} from "@/lib/data/schedules";
import { todayIso } from "@/lib/date";
import { fontSize, radius, spacing, type ThemeColors } from "@/constants/theme";

export default function ScheduleScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [holidays, setHolidays] = useState<HolidayItem[]>([]);
  const [selectedDate, setSelectedDate] = useState(todayIso());

  const load = useCallback(async () => {
    try {
      const [scheduleItems, holidayItems] = await Promise.all([
        fetchSchedules(true),
        fetchHolidays(),
      ]);
      setSchedules(scheduleItems);
      setHolidays(holidayItems);
    } catch (error) {
      Alert.alert(
        "Could not load schedule calendar",
        error instanceof Error ? error.message : "Please try again."
      );
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const scheduleDates = useMemo(
    () => new Set(schedules.map((schedule) => schedule.date)),
    [schedules]
  );
  const holidayDateSet = useMemo(
    () => new Set(holidays.flatMap((holiday) => holiday.dates)),
    [holidays]
  );

  const filtered = schedules.filter((s) => s.date === selectedDate);
  const selectedHolidays = holidays.filter((holiday) =>
    holiday.dates.includes(selectedDate)
  );

  return (
    <View style={styles.screen}>
      <AppHeader />
      <View style={styles.body}>
        <Calendar
          current={selectedDate}
          onDayPress={(day: { dateString: string }) => setSelectedDate(day.dateString)}
          dayComponent={({ date, state, onPress }) => {
            if (!date) return null;
            const isSelected = date.dateString === selectedDate;
            const isHoliday = holidayDateSet.has(date.dateString);
            const hasSchedule = scheduleDates.has(date.dateString);
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${date.day}${isHoliday ? ", holiday" : ""}${hasSchedule ? ", collection scheduled" : ""}`}
                onPress={() => onPress?.(date)}
                style={[
                  styles.calendarDay,
                  isSelected && styles.calendarDaySelected,
                ]}
              >
                <Text
                  style={[
                    styles.calendarDayText,
                    state === "disabled" && styles.calendarDayDisabled,
                    hasSchedule && styles.scheduleDateText,
                    isHoliday && styles.holidayDateText,
                    isSelected &&
                      (isHoliday
                        ? styles.calendarDayHolidaySelected
                        : styles.calendarDaySelectedText),
                  ]}
                >
                  {date.day}
                </Text>
                <View style={styles.indicators}>
                  {hasSchedule ? <View style={styles.collectionIndicator} /> : null}
                  {isHoliday ? <View style={styles.holidayIndicator} /> : null}
                </View>
              </Pressable>
            );
          }}
          theme={{
            calendarBackground: colors.surface,
            backgroundColor: colors.surface,
            dayTextColor: colors.text,
            monthTextColor: colors.text,
            textDisabledColor: colors.textMuted,
            todayTextColor: colors.primary,
            arrowColor: colors.primary,
            selectedDayBackgroundColor: colors.primary,
            textDayFontWeight: "500",
            textMonthFontWeight: "700",
          }}
          style={styles.calendar}
        />

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View>
              <Text style={styles.listTitle}>Upcoming Collections</Text>
              {selectedHolidays.map((holiday) => (
                <View key={holiday.id} style={styles.holidayCard}>
                  <Text style={styles.holidayLabel}>Holiday</Text>
                  <Text style={styles.holidayTitle}>{holiday.title}</Text>
                  <Text style={styles.holidayTime}>{holiday.timeLabel}</Text>
                </View>
              ))}
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              accessibilityRole="button"
              accessibilityLabel={`Track collection for ${item.barangay} on ${item.dateLabel}`}
              onPress={() =>
                router.push({
                  pathname: "/(app)/(resident)/collection-tracking",
                  params: { scheduleId: item.id },
                } as never)
              }
            >
              <View style={styles.cardLeft}>
                <Text style={styles.cardDate}>
                  {item.dateLabel} ({item.dayLabel})
                </Text>
                <Text style={styles.cardBarangay}>{item.barangay}</Text>
              </View>
              <Text style={styles.cardTime}>
                {formatTimeRange(item.timeStart, item.timeEnd)}
              </Text>
              <View style={styles.trackHint}>
                <Text style={styles.trackHintText}>Track</Text>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {selectedHolidays.length
                ? "No collection scheduled for this date."
                : "No collections or holidays for this date."}
            </Text>
          }
        />
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    body: { flex: 1 },
    calendar: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    calendarDay: {
      width: 40,
      height: 42,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 21,
    },
    calendarDaySelected: {
      backgroundColor: colors.primary,
    },
    calendarDayHolidaySelected: {
      backgroundColor: "#f3e8ff",
    },
    calendarDayText: {
      color: colors.text,
      fontSize: fontSize.sm,
    },
    calendarDaySelectedText: {
      color: colors.white,
      fontWeight: "700",
    },
    scheduleDateText: {
      color: colors.primary,
      fontWeight: "800",
    },
    calendarDayDisabled: {
      color: colors.textMuted,
      opacity: 0.5,
    },
    holidayDateText: {
      color: "#9333ea",
      fontWeight: "800",
    },
    indicators: {
      position: "absolute",
      bottom: 3,
      flexDirection: "row",
      gap: 3,
    },
    collectionIndicator: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.primary,
    },
    holidayIndicator: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: "#9333ea",
    },
    list: {
      padding: spacing.md,
      gap: spacing.sm,
    },
    listTitle: {
      fontSize: fontSize.md,
      fontWeight: "700",
      color: colors.text,
      marginBottom: spacing.sm,
    },
    holidayCard: {
      backgroundColor: "#f3e8ff",
      borderColor: "#d8b4fe",
      borderWidth: 1,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.md,
      gap: 3,
    },
    holidayLabel: {
      color: "#7e22ce",
      fontSize: fontSize.xs,
      fontWeight: "800",
      textTransform: "uppercase",
    },
    holidayTitle: {
      color: colors.text,
      fontSize: fontSize.md,
      fontWeight: "800",
    },
    holidayTime: {
      color: colors.textMuted,
      fontSize: fontSize.sm,
    },
    card: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    cardLeft: { flex: 1, gap: 2 },
    cardDate: {
      fontWeight: "700",
      color: colors.text,
      fontSize: fontSize.sm,
    },
    cardBarangay: {
      color: colors.textMuted,
      fontSize: fontSize.sm,
    },
    cardTime: {
      color: colors.primary,
      fontWeight: "700",
      fontSize: fontSize.sm,
    },
    trackHint: {
      flexBasis: "100%",
      alignItems: "flex-end",
      marginTop: spacing.xs,
    },
    trackHintText: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: "600" },
    empty: {
      textAlign: "center",
      color: colors.textMuted,
      paddingVertical: spacing.xl,
    },
  });
}
