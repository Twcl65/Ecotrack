import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
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
import { isSupabaseConfigured } from "@/lib/supabase";
import { colors, fontSize, radius, spacing } from "@/constants/theme";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    if (!isSupabaseConfigured) {
      setError("The app is missing its server connection. Rebuild the APK with Supabase keys set.");
      return;
    }
    if (!email.trim()) {
      setError("Enter your email or username.");
      return;
    }
    if (!password) {
      setError("Enter your password.");
      return;
    }

    setLoading(true);
    setError(null);
    const result = await signIn(email.trim(), password);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Logo variant="light" size="sm" />
        <Text style={styles.location}>Jasaan, Misamis Oriental</Text>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={[
          styles.cardWrap,
          { paddingBottom: insets.bottom + spacing.lg },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Logo size="sm" />
          <Text style={styles.title}>Welcome to ECOTRACK</Text>
          <Text style={styles.subtitle}>Sign in with your account to continue.</Text>

          <View style={styles.form}>
            <AppInput
              label="Email or Username"
              icon="mail-outline"
              placeholder="you@email.com or juan.driver"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <AppInput
              label="Password"
              icon="lock-closed-outline"
              placeholder="Enter your password"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              rightIcon={showPassword ? "eye-off-outline" : "eye-outline"}
              onRightIconPress={() => setShowPassword((v) => !v)}
            />
            <Pressable style={styles.forgotWrap}>
              <Text style={styles.forgot}>Forgot Password?</Text>
            </Pressable>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <AppButton label="Login" onPress={handleLogin} loading={loading} />
            <Text style={styles.footer}>
              New resident?{" "}
              <Text
                style={styles.footerLink}
                onPress={() => router.push("/(auth)/register")}
              >
                Register here
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
    gap: spacing.sm,
  },
  location: {
    color: "rgba(255,255,255,0.9)",
    fontSize: fontSize.sm,
  },
  body: { flex: 1 },
  cardWrap: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
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
  },
  form: {
    gap: spacing.md,
  },
  forgotWrap: {
    alignSelf: "flex-end",
  },
  forgot: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
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
