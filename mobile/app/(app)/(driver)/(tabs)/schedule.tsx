import { useRouter } from "expo-router";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Calendar } from "react-native-calendars";
import AppHeader from "@/components/AppHeader";
import CollectionStatusBadge from "@/components/CollectionStatusBadge";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { fetchHolidays, type HolidayItem } from "@/lib/data/announcements";
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
  const [holidays, setHolidays] = useState<HolidayItem[]>([]);
  const [selectedDate, setSelectedDate] = useState(todayIso());

  const driverName = profile?.fullName ?? "Driver";

  const load = useCallback(async () => {
    try {
      const [all, holidayItems] = await Promise.all([
        fetchSchedules(true),
        fetchHolidays(),
      ]);
      setSchedules(filterDriverSchedules(all, driverName));
      setHolidays(holidayItems);
    } catch (error) {
      Alert.alert(
        "Could not load schedule calendar",
        error instanceof Error ? error.message : "Please try again."
      );
    }
  }, [driverName]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const scheduleDateColors = useMemo(() => {
    const dateColors = new Map<string, string>();
    schedules.forEach((schedule) => {
      const dotColor =
        schedule.status === "completed"
          ? colors.primary
          : schedule.status === "ongoing"
            ? colors.info
            : colors.warning;
      dateColors.set(schedule.date, dotColor);
    });
    return dateColors;
  }, [schedules, colors]);
  const holidayDateSet = useMemo(
    () => new Set(holidays.flatMap((holiday) => holiday.dates)),
    [holidays]
  );

  const dayItems = schedules.filter((s) => s.date === selectedDate);
  const selectedHolidays = holidays.filter((holiday) =>
    holiday.dates.includes(selectedDate)
  );

  return (
    <View style={styles.screen}>
      <AppHeader title="My Schedule" module="driver" />
      <Calendar
        current={selectedDate}
        onDayPress={(day: { dateString: string }) => setSelectedDate(day.dateString)}
        dayComponent={({ date, state, onPress }) => {
          if (!date) return null;
          const isSelected = date.dateString === selectedDate;
          const isHoliday = holidayDateSet.has(date.dateString);
          const scheduleColor = scheduleDateColors.get(date.dateString);
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${date.day}${isHoliday ? ", holiday" : ""}${scheduleColor ? ", collection scheduled" : ""}`}
              onPress={() => onPress?.(date)}
              style={[
                styles.calendarDay,
                isSelected &&
                  (isHoliday
                    ? styles.calendarDayHolidaySelected
                    : styles.calendarDaySelected),
              ]}
            >
              <Text
                style={[
                  styles.calendarDayText,
                  state === "disabled" && styles.calendarDayDisabled,
                  scheduleColor ? { color: scheduleColor, fontWeight: "800" } : null,
                  isHoliday && styles.holidayDateText,
                  isSelected && !isHoliday && styles.calendarDaySelectedText,
                ]}
              >
                {date.day}
              </Text>
              <View style={styles.indicators}>
                {scheduleColor ? (
                  <View style={[styles.scheduleIndicator, { backgroundColor: scheduleColor }]} />
                ) : null}
                {isHoliday ? <View style={styles.holidayIndicator} /> : null}
              </View>
            </Pressable>
          );
        }}
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
          <>
            <Text style={styles.listTitle}>Collections on selected date</Text>
            {selectedHolidays.map((holiday) => (
              <View key={holiday.id} style={styles.holidayCard}>
                <Text style={styles.holidayLabel}>Holiday</Text>
                <Text style={styles.holidayTitle}>{holiday.title}</Text>
                <Text style={styles.holidayTime}>{holiday.timeLabel}</Text>
              </View>
            ))}
          </>
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
          <Text style={styles.empty}>
            {selectedHolidays.length
              ? "No collections scheduled for this date."
              : "No collections or holidays for this date."}
          </Text>
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
    scheduleIndicator: {
      width: 4,
      height: 4,
      borderRadius: 2,
    },
    holidayIndicator: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: "#9333ea",
    },
    list: { padding: spacing.md, gap: spacing.sm },
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
