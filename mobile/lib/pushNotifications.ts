import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import type { AppRole } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

const TOKEN_STORAGE_KEY = "ecotrack-expo-push-token";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerPushToken(
  userId: string,
  appRole: AppRole
): Promise<{ error?: string }> {
  if (Platform.OS === "web" || !Device.isDevice) return {};
  if (appRole !== "admin" && appRole !== "driver" && appRole !== "resident") {
    return { error: "Your account role cannot register for push notifications." };
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "ECOTRACK notifications",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#056636",
    });
  }

  let permission = await Notifications.getPermissionsAsync();
  if (permission.status !== "granted") {
    permission = await Notifications.requestPermissionsAsync();
  }
  if (permission.status !== "granted") {
    return { error: "Push notification permission was not granted." };
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) {
    return { error: "Expo project ID is missing from the app configuration." };
  }

  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  const role =
    appRole === "admin"
      ? "administrator"
      : appRole === "resident"
        ? "viewer"
        : "driver";
  const platform = Platform.OS === "ios" ? "ios" : "android";
  const { error } = await supabase.from("push_tokens").upsert(
    {
      user_id: userId,
      expo_push_token: token,
      role,
      platform,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,expo_push_token" }
  );
  if (error) return { error: `Could not register push notifications: ${error.message}` };

  await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
  return {};
}

export async function unregisterPushToken(userId: string): Promise<void> {
  const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
  if (!token) return;

  const { error } = await supabase
    .from("push_tokens")
    .delete()
    .eq("user_id", userId)
    .eq("expo_push_token", token);
  if (error) throw new Error(`Could not unregister push token: ${error.message}`);

  await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
}
