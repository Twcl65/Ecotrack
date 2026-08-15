import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import AppHeader from "@/components/AppHeader";
import { HeaderLogo } from "@/components/Logo";
import { useTheme } from "@/context/ThemeContext";
import { fontSize, radius, spacing, type ThemeColors } from "@/constants/theme";

const HIGHLIGHTS = [
  {
    icon: "radio-outline" as const,
    title: "Smart Monitoring",
    description: "Real-time tracking and monitoring",
  },
  {
    icon: "git-branch-outline" as const,
    title: "Efficient Collection",
    description: "Optimized routes and schedules",
  },
  {
    icon: "bar-chart-outline" as const,
    title: "Data-Driven",
    description: "Reports and insights for better decisions",
  },
  {
    icon: "leaf-outline" as const,
    title: "Eco-Friendly",
    description: "Promoting sustainability in our community",
  },
];

export default function DriverAboutScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.screen}>
      <AppHeader title="About ECOTRACK" showBack module="driver" showBell={false} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <HeaderLogo />
          <Text style={styles.heroTitle}>Smart Waste Management for a Better Tomorrow</Text>
          <Text style={styles.heroText}>
            ECOTRACK helps Jasaan LGU efficiently manage, monitor, and optimize waste
            collection for a cleaner and healthier environment.
          </Text>
        </View>

        <View style={styles.aboutCard}>
          <Text style={styles.sectionTitle}>About ECOTRACK</Text>
          <Text style={styles.bodyText}>
            ECOTRACK is Jasaan's smart waste management platform. The driver app helps
            collection teams follow assigned routes, track daily schedules, and receive
            real-time updates from the LGU.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>What We Offer</Text>
        <View style={styles.grid}>
          {HIGHLIGHTS.map((item) => (
            <View key={item.title} style={styles.highlightCard}>
              <View style={styles.highlightIcon}>
                <Ionicons name={item.icon} size={20} color={colors.primary} />
              </View>
              <Text style={styles.highlightTitle}>{item.title}</Text>
              <Text style={styles.highlightText}>{item.description}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.footer}>
          © {new Date().getFullYear()} ECOTRACK — Cleaner Jasaan, Greener Tomorrow
        </Text>
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
    heroCard: {
      backgroundColor: colors.primary,
      borderRadius: radius.lg,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    heroTitle: {
      color: colors.white,
      fontSize: fontSize.lg,
      fontWeight: "800",
      marginTop: spacing.sm,
    },
    heroText: {
      color: "rgba(255,255,255,0.9)",
      fontSize: fontSize.sm,
      lineHeight: 21,
    },
    aboutCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    sectionTitle: {
      fontSize: fontSize.md,
      fontWeight: "800",
      color: colors.text,
    },
    bodyText: {
      color: colors.textMuted,
      fontSize: fontSize.sm,
      lineHeight: 21,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    highlightCard: {
      width: "48%",
      flexGrow: 1,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      gap: 4,
    },
    highlightIcon: {
      width: 36,
      height: 36,
      borderRadius: radius.sm,
      backgroundColor: colors.primaryLight,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
    },
    highlightTitle: {
      fontWeight: "700",
      color: colors.text,
      fontSize: fontSize.sm,
    },
    highlightText: {
      color: colors.textMuted,
      fontSize: fontSize.xs,
      lineHeight: 16,
    },
    footer: {
      textAlign: "center",
      color: colors.textMuted,
      fontSize: fontSize.xs,
      marginTop: spacing.sm,
    },
  });
}
