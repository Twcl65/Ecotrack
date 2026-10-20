import { Image, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fontSize, spacing } from "@/constants/theme";

export default function AppSplashScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <View style={styles.content}>
        <Image
          source={require("@/assets/images/splash-icon.png")}
          style={styles.mark}
          resizeMode="contain"
          accessibilityLabel="ECOTRACK"
        />
        <Text style={styles.title}>ECOTRACK</Text>
        <Text style={styles.tagline}>Cleaner Jasaan, Greener Tomorrow</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  mark: {
    width: 168,
    height: 168,
    marginBottom: spacing.md,
  },
  title: {
    color: colors.white,
    fontSize: fontSize.xxl + 4,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  tagline: {
    marginTop: 6,
    color: "rgba(255,255,255,0.85)",
    fontSize: fontSize.sm,
  },
});
