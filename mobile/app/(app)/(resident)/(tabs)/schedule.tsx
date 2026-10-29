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
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const [year, month] = todayIso().split("-").map(Number);
    return { year, month };
  });

  const dateRange = useMemo(() => {
    const lastDay = new Date(
      Date.UTC(visibleMonth.year, visibleMonth.month, 0)
    ).getUTCDate();
    const month = String(visibleMonth.month).padStart(2, "0");
    return {
      fromDate: `${visibleMonth.year}-${month}-01`,
      toDate: `${visibleMonth.year}-${month}-${String(lastDay).padStart(2, "0")}`,
    };
  }, [visibleMonth]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const load = async () => {
        try {
          const scheduleItems = await fetchSchedules(true, dateRange);
          if (!isActive) return;
          setSchedules(scheduleItems);
        } catch (error) {
          if (!isActive) return;
          Alert.alert(
            "Could not load schedule calendar",
            error instanceof Error ? error.message : "Please try again."
          );
        }
      };

      void load();
      return () => {
        isActive = false;
      };
    }, [dateRange])
  );

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      fetchHolidays()
        .then((holidayItems) => {
          if (isActive) setHolidays(holidayItems);
        })
        .catch((error: unknown) => {
          if (!isActive) return;
          Alert.alert(
            "Could not load schedule calendar",
            error instanceof Error ? error.message : "Please try again."
          );
        });

      return () => {
        isActive = false;
      };
    }, [])
  );

  const scheduleDates = useMemo(
    () => new Set(schedules.map((schedule) => schedule.date)),
    [schedules]
  );
  const holidayDateSet = useMemo(
    () => new Set(holidays.flatMap((holiday) => holiday.dates)),
    [holidays]
  );
  const markedDates = useMemo(() => {
    const marks: Record<
      string,
      {
        selected?: boolean;
        selectedColor?: string;
        selectedTextColor?: string;
        dots?: { key: string; color: string }[];
      }
    > = {};

    for (const date of scheduleDates) {
      marks[date] = {
        dots: [{ key: "collection", color: colors.primary }],
      };
    }

    for (const date of holidayDateSet) {
      const current = marks[date] ?? {};
      marks[date] = {
        ...current,
        dots: [
          ...(current.dots ?? []),
          { key: "holiday", color: "#9333ea" },
        ],
      };
    }

    marks[selectedDate] = {
      ...marks[selectedDate],
      selected: true,
      selectedColor: colors.primary,
      selectedTextColor: colors.white,
    };
    return marks;
  }, [colors.primary, colors.white, holidayDateSet, scheduleDates, selectedDate]);

  const filtered = useMemo(
    () => schedules.filter((schedule) => schedule.date === selectedDate),
    [schedules, selectedDate]
  );
  const selectedHolidays = useMemo(
    () =>
      holidays.filter((holiday) => holiday.dates.includes(selectedDate)),
    [holidays, selectedDate]
  );

  return (
    <View style={styles.screen}>
      <AppHeader />
      <View style={styles.body}>
        <Calendar
          current={selectedDate}
          hideExtraDays
          enableSwipeMonths
          markingType="multi-dot"
          markedDates={markedDates}
          onDayPress={(day: { dateString: string }) => setSelectedDate(day.dateString)}
          onMonthChange={(date: { year: number; month: number }) => {
            const maxDay = new Date(
              Date.UTC(date.year, date.month, 0)
            ).getUTCDate();
            const selectedDay = Math.min(
              Number(selectedDate.slice(-2)),
              maxDay
            );
            setVisibleMonth({ year: date.year, month: date.month });
            setSelectedDate(
              `${date.year}-${String(date.month).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`
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
          initialNumToRender={6}
          maxToRenderPerBatch={6}
          windowSize={5}
          removeClippedSubviews
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
