import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import AppHeader from "@/components/AppHeader";
import { useTheme } from "@/context/ThemeContext";
import { fontSize, radius, spacing, type ThemeColors } from "@/constants/theme";

const SUPPORT_EMAIL = "ecotrack@jasaan.gov.ph";

const FAQ_ITEMS = [
  {
    question: "How do I view my assigned route?",
    answer:
      "Open the Route tab to see your map, stops, and estimated travel time. Tap Start Collection when ready.",
  },
  {
    question: "How do I check today's collections?",
    answer:
      "Use the Status tab for today's progress, or Schedule to browse other dates on the calendar.",
  },
  {
    question: "Where can I see LGU announcements?",
    answer:
      "Tap the megaphone icon in the header, or open Announcements from the More menu.",
  },
];

export default function DriverHelpSupportScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  async function openEmail() {
    const url = `mailto:${SUPPORT_EMAIL}`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    }
  }

  return (
    <View style={styles.screen}>
      <AppHeader title="Help & Support" showBack module="driver" showBell={false} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.contactCard}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <Text style={styles.orgName}>Municipal Government of Jasaan, Misamis Oriental</Text>

          <Pressable style={styles.contactRow} onPress={openEmail}>
            <View style={styles.contactIcon}>
              <Ionicons name="mail-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.contactText}>
              <Text style={styles.contactLabel}>Email</Text>
              <Text style={styles.contactValue}>{SUPPORT_EMAIL}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        {FAQ_ITEMS.map((item) => (
          <View key={item.question} style={styles.faqCard}>
            <Text style={styles.faqQuestion}>{item.question}</Text>
            <Text style={styles.faqAnswer}>{item.answer}</Text>
          </View>
        ))}

        <View style={styles.noteCard}>
          <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          <Text style={styles.noteText}>
            For urgent route or schedule concerns, contact MENRO through the email above
            during office hours.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: {
      padding: spacing.md,
      gap: spacing.md,
      paddingBottom: spacing.xl,
    },
    contactCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      gap: spacing.md,
    },
    sectionTitle: {
      fontSize: fontSize.md,
      fontWeight: "800",
      color: colors.text,
    },
    orgName: {
      color: colors.textMuted,
      fontSize: fontSize.sm,
      lineHeight: 20,
    },
    contactRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.md,
      backgroundColor: colors.background,
    },
    contactIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primaryLight,
      alignItems: "center",
      justifyContent: "center",
    },
    contactText: { flex: 1, gap: 2 },
    contactLabel: {
      fontSize: fontSize.xs,
      color: colors.textMuted,
      fontWeight: "600",
      textTransform: "uppercase",
    },
    contactValue: {
      fontSize: fontSize.sm,
      color: colors.primary,
      fontWeight: "700",
    },
    faqCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      gap: spacing.sm,
    },
    faqQuestion: {
      fontWeight: "700",
      color: colors.text,
      fontSize: fontSize.sm,
    },
    faqAnswer: {
      color: colors.textMuted,
      fontSize: fontSize.sm,
      lineHeight: 20,
    },
    noteCard: {
      flexDirection: "row",
      gap: spacing.sm,
      backgroundColor: colors.primaryLight,
      borderRadius: radius.md,
      padding: spacing.md,
      alignItems: "flex-start",
    },
    noteText: {
      flex: 1,
      color: colors.text,
      fontSize: fontSize.sm,
      lineHeight: 20,
    },
  });
}
