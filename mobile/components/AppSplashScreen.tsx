import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Logo from "@/components/Logo";
import { colors, spacing } from "@/constants/theme";

export default function AppSplashScreen() {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[colors.primary, colors.primaryDark]}
      style={[
        styles.screen,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <View style={styles.content}>
        <Logo variant="light" size="lg" />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
});
