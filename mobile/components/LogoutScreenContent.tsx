import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppButton from "@/components/AppButton";
import Logo from "@/components/Logo";
import { useTheme } from "@/context/ThemeContext";
import { useLogout } from "@/hooks/useLogout";
import { fontSize, spacing } from "@/constants/theme";

export default function LogoutScreenContent() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { logout, loading } = useLogout();

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + spacing.xl, backgroundColor: colors.primaryDark },
      ]}
    >
      <Logo variant="light" size="md" />
      <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
        <Ionicons name="log-out-outline" size={48} color={colors.danger} />
      </View>
      <Text style={[styles.title, { color: colors.white }]}>Logout</Text>
      <Text style={styles.subtitle}>Are you sure you want to logout?</Text>

      <View style={styles.actions}>
        <AppButton label="Yes, Logout" onPress={logout} loading={loading} variant="danger" />
        <AppButton
          label="Cancel"
          variant="outline"
          onPress={() => router.back()}
          disabled={loading}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xl,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: "800",
  },
  subtitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: fontSize.md,
    textAlign: "center",
  },
  actions: {
    width: "100%",
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
});
