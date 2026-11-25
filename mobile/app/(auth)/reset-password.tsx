import { useRouter } from "expo-router";
import { useState } from "react";
import {
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
import { colors, fontSize, radius, spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { passwordRecovery } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpdatePassword() {
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!isSupabaseConfigured) {
      setError("The app is missing its server connection. Please contact support.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
      } else {
        setCompleted(true);
      }
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Could not update your password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  const recoveryError =
    passwordRecovery.status === "error"
      ? passwordRecovery.error ?? "Could not verify the password reset link."
      : null;

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
          <Logo size="sm" />
          <Text style={styles.title}>
            {completed ? "Password updated" : "Choose a new password"}
          </Text>

          {completed ? (
            <>
              <Text style={styles.subtitle}>
                Your password has been changed. Sign in with your new password to continue.
              </Text>
              <AppButton
                label="Continue to app"
                onPress={() => router.replace("/")}
              />
            </>
          ) : passwordRecovery.status === "ready" ? (
            <View style={styles.form}>
              <Text style={styles.subtitle}>
                Enter and confirm a new password for your account.
              </Text>
              <AppInput
                label="New password"
                icon="lock-closed-outline"
                placeholder="At least 6 characters"
                secureTextEntry
                autoCapitalize="none"
                value={password}
                onChangeText={setPassword}
              />
              <AppInput
                label="Confirm new password"
                icon="lock-closed-outline"
                placeholder="Confirm your new password"
                secureTextEntry
                autoCapitalize="none"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <AppButton
                label="Update password"
                onPress={handleUpdatePassword}
                loading={loading}
              />
            </View>
          ) : passwordRecovery.status === "processing" ? (
            <Text style={styles.subtitle}>Verifying your reset link…</Text>
          ) : (
            <>
              <Text style={styles.subtitle}>
                {recoveryError ??
                  "Open this screen using the password reset link sent to your email."}
              </Text>
              <AppButton
                label="Request a new link"
                onPress={() => router.replace("/(auth)/forgot-password")}
              />
            </>
          )}
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
    flexGrow: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: "800",
    color: colors.text,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  form: { gap: spacing.md },
  error: {
    color: colors.danger,
    fontSize: fontSize.sm,
    backgroundColor: "#fef2f2",
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
});
