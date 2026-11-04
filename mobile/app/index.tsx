import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Logo from "@/components/Logo";
import { fontSize, radius, spacing } from "@/constants/theme";
import LandingCollectionImage from "../assets/images/landing-collection.png";

const FEATURES = [
  { icon: "calendar-outline" as const, label: "View\nSchedule" },
  { icon: "location-outline" as const, label: "See Collection\nPoints" },
  { icon: "checkmark-circle-outline" as const, label: "Track Collection\nStatus" },
  { icon: "notifications-outline" as const, label: "Get\nAnnouncements" },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Math.max(insets.top, spacing.md), paddingBottom: insets.bottom + spacing.md },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.brand}>
            <Logo size="md" showTagline={false} />
            <Text style={styles.location}>Jasaan Solid Waste Management System</Text>
          </View>

          <Image
            source={LandingCollectionImage}
            style={styles.heroImage}
            resizeMode="contain"
            alt="ECOTRACK collection truck in a green community"
            accessibilityLabel="ECOTRACK collection truck in a green community"
          />

          <View style={styles.content}>
            <Text style={styles.eyebrow}>RESIDENT & DRIVER APP</Text>
            <Text style={styles.title}>Efficient Routes.{"\n"}Cleaner Communities.</Text>
            <Text style={styles.description}>
              Stay up to date with schedules, collection progress, and community
              announcements — all in one place.
            </Text>

            <View style={styles.features}>
              {FEATURES.map((feature) => (
                <View key={feature.label} style={styles.feature}>
                  <View style={styles.featureIcon}>
                    <Ionicons name={feature.icon} size={27} color="#056636" />
                  </View>
                  <Text style={styles.featureLabel}>{feature.label}</Text>
                </View>
              ))}
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/(auth)/login")}
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            >
              <LinearGradient
                colors={["#16834f", "#056636"]}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>Get Started</Text>
                <Ionicons name="arrow-forward" size={20} color="#ffffff" />
              </LinearGradient>
            </Pressable>

            <Text style={styles.footer}>Together for a cleaner and greener Jasaan.</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f0f5f2",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  card: {
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  brand: {
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 14,
  },
  location: {
    marginTop: spacing.xs,
    color: "#52675b",
    fontSize: fontSize.xs,
    fontWeight: "600",
  },
  heroImage: {
    width: "100%",
    height: 200,
    alignSelf: "center",
    borderRadius: radius.md,
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 18,
  },
  eyebrow: {
    color: "#16834f",
    fontSize: fontSize.sm,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  title: {
    marginTop: spacing.xs,
    color: "#073b25",
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 33,
  },
  description: {
    marginTop: spacing.sm,
    color: "#58665d",
    fontSize: fontSize.md,
    lineHeight: 22,
  },
  features: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.xs,
    marginTop: 18,
    marginBottom: 18,
  },
  feature: {
    flex: 1,
    alignItems: "center",
    gap: spacing.xs,
  },
  featureIcon: {
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: "#e8f5ee",
  },
  featureLabel: {
    color: "#234335",
    fontSize: 10,
    fontWeight: "600",
    lineHeight: 14,
    textAlign: "center",
  },
  button: {
    overflow: "hidden",
    borderRadius: radius.full,
  },
  buttonPressed: {
    opacity: 0.86,
  },
  buttonGradient: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: fontSize.md,
    fontWeight: "800",
  },
  footer: {
    marginTop: 14,
    color: "#84958b",
    fontSize: fontSize.xs,
    textAlign: "center",
  },
});
