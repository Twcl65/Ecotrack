import * as Linking from "expo-linking";
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
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSendReset() {
    const accountEmail = email.trim();
    if (!accountEmail) {
      setError("Enter the email address associated with your account.");
      return;
    }
    if (!isSupabaseConfigured) {
      setError("The app is missing its server connection. Please contact support.");
      return;
    }

    setLoading(true);
    setError(null);
    setSent(false);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        accountEmail,
        { redirectTo: Linking.createURL("reset-password") }
      );
      if (resetError) {
        setError(resetError.message);
      } else {
        setSent(true);
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not send a password reset email. Please try again."
      );
    } finally {
      setLoading(false);
    }
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
          <Logo size="sm" />
          <Text style={styles.title}>
            {sent ? "Check your email" : "Forgot your password?"}
          </Text>
          <Text style={styles.subtitle}>
            {sent
              ? "If an account matches that email, a password reset link will be sent."
              : "Enter the email address linked to your resident or driver account."}
          </Text>

          {!sent && (
            <View style={styles.form}>
              <AppInput
                label="Account email"
                icon="mail-outline"
                placeholder="you@email.com"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <AppButton
                label="Send reset link"
                onPress={handleSendReset}
                loading={loading}
              />
            </View>
          )}

          {sent && error ? <Text style={styles.error}>{error}</Text> : null}
          <Text style={styles.footer}>
            Remembered your password?{" "}
            <Text
              style={styles.footerLink}
              onPress={() => router.replace("/(auth)/login")}
            >
              Back to login
            </Text>
          </Text>
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
