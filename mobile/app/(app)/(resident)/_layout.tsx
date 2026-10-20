import { Stack } from "expo-router";

export default function ResidentLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="announcements" />
      <Stack.Screen name="announcement-detail" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="complaint-detail" />
      <Stack.Screen name="collection-tracking" />
      <Stack.Screen name="notification-detail" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="about" />
      <Stack.Screen name="help-support" />
      <Stack.Screen name="feedback" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="logout" options={{ presentation: "modal" }} />
    </Stack>
  );
}
