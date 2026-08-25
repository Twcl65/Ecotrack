import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { Calendar } from "react-native-calendars";
import AppHeader from "@/components/AppHeader";
import { useTheme } from "@/context/ThemeContext";
import { fetchSchedules, type ScheduleItem } from "@/lib/data/schedules";
import { todayIso } from "@/lib/date";
import { fontSize, radius, spacing, type ThemeColors } from "@/constants/theme";

export default function ScheduleScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [selectedDate, setSelectedDate] = useState(todayIso());

  const load = useCallback(async () => {
    setSchedules(await fetchSchedules());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markedDates = useMemo(() => {
    const marks: Record<string, { marked?: boolean; dotColor?: string; selected?: boolean; selectedColor?: string }> = {};
    schedules.forEach((s) => {
      marks[s.date] = { marked: true, dotColor: colors.primary };
    });
    marks[selectedDate] = {
      ...(marks[selectedDate] ?? {}),
      selected: true,
      selectedColor: colors.primary,
    };
    return marks;
  }, [schedules, selectedDate, colors.primary]);

  const filtered = schedules.filter((s) => s.date >= selectedDate).slice(0, 8);

  return (
    <View style={styles.screen}>
      <AppHeader />
      <View style={styles.body}>
        <Calendar
          current={selectedDate}
          onDayPress={(day: { dateString: string }) => setSelectedDate(day.dateString)}
          markedDates={markedDates}
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
            <Text style={styles.listTitle}>Upcoming Collections</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardLeft}>
                <Text style={styles.cardDate}>
                  {item.dateLabel} ({item.dayLabel})
                </Text>
                <Text style={styles.cardBarangay}>{item.barangay}</Text>
              </View>
              <Text style={styles.cardTime}>{item.timeStart ?? "TBD"}</Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>No schedules found for this period.</Text>
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
    card: {
      flexDirection: "row",
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
    empty: {
      textAlign: "center",
      color: colors.textMuted,
      paddingVertical: spacing.xl,
    },
  });
}
