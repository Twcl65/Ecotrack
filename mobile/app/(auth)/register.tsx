import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppButton from "@/components/AppButton";
import AppInput from "@/components/AppInput";
import Logo from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";
import { colors, fontSize, radius, spacing } from "@/constants/theme";

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRegister() {
    if (!fullName.trim()) return setError("Full name is required.");
    if (!email.trim()) return setError("Email is required.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirmPassword) return setError("Passwords do not match.");

    setLoading(true);
    setError(null);
    const result = await signUp({ email, password, fullName, phone });
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.needsEmailConfirmation) {
      Alert.alert(
        "Check your email",
        "Confirm your email address, then sign in to continue.",
        [{ text: "Go to Login", onPress: () => router.replace("/(auth)/login") }]
      );
      return;
    }

    // Session created — root navigator sends user into the app.
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Logo variant="light" size="sm" />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.lg },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Register as a resident of Jasaan.</Text>

          <View style={styles.form}>
            <AppInput
              label="Full Name"
              icon="person-outline"
              placeholder="Maria Santos"
              value={fullName}
              onChangeText={setFullName}
            />
            <AppInput
              label="Email Address"
              icon="mail-outline"
              placeholder="you@email.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <AppInput
              label="Contact Number"
              icon="call-outline"
              placeholder="0912 345 6789"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
            <AppInput
              label="Password"
              icon="lock-closed-outline"
              placeholder="At least 6 characters"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <AppInput
              label="Confirm Password"
              icon="lock-closed-outline"
              placeholder="Confirm password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <AppButton label="Register" onPress={handleRegister} loading={loading} />
            <Text style={styles.footer}>
              Already have an account?{" "}
              <Text style={styles.footerLink} onPress={() => router.back()}>
                Login
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    alignItems: "center",
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: "800",
    color: colors.text,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  form: { gap: spacing.md },
  error: {
    color: colors.danger,
    fontSize: fontSize.sm,
    backgroundColor: "#fef2f2",
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  footer: {
    textAlign: "center",
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  footerLink: {
    color: colors.primary,
    fontWeight: "700",
  },
});
