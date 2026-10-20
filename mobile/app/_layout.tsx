import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AppSplashScreen from "@/components/AppSplashScreen";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";

const SPLASH_MIN_MS = 2500;

if (Platform.OS !== "web") {
  SplashScreen.preventAutoHideAsync().catch(() => {});
}

let nativeSplashHidden = false;

function hideNativeSplash() {
  if (nativeSplashHidden || Platform.OS === "web") return;
  nativeSplashHidden = true;
  SplashScreen.hideAsync().catch(() => {});
}

function RootNavigator() {
  const { session, profile, loading } = useAuth();
  const { colors, isDark } = useTheme();
  const segments = useSegments();
  const router = useRouter();
  const [splashMinDone, setSplashMinDone] = useState(false);

  useEffect(() => {
    hideNativeSplash();
    const timer = setTimeout(() => setSplashMinDone(true), SPLASH_MIN_MS);
    return () => clearTimeout(timer);
  }, []);

  const showSplash = loading || !splashMinDone;

  useEffect(() => {
    if (showSplash) return;

    const root = segments[0];
    const inAuth = root === "(auth)";
    const inApp = root === "(app)";
    const onWelcome = !root;

    if (!session) {
      if (inApp || onWelcome) {
        if (router.canDismiss?.()) {
          router.dismissAll();
        }
        router.replace("/(auth)/login");
      }
      return;
    }

    if (!profile) return;

    if (profile.role === "driver") {
      const appSection = (segments as string[])[1];
      if (!inApp || appSection !== "(driver)") {
        router.replace("/(app)/(driver)/(tabs)" as never);
      }
    } else if (onWelcome || inAuth) {
      router.replace("/(app)/(resident)/(tabs)");
    }
  }, [session, profile, showSplash, segments, router]);

  if (showSplash) {
    return (
      <>
        <StatusBar style="light" />
        <AppSplashScreen />
      </>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
