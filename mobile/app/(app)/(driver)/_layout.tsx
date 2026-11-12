import { Stack } from "expo-router";

export default function DriverLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="garbage-history" />
      <Stack.Screen name="garbage-history-detail" />
      <Stack.Screen name="schedule-detail" />
      <Stack.Screen name="route-nav" />
      <Stack.Screen name="route-history" />
      <Stack.Screen name="announcements" />
      <Stack.Screen name="announcement-detail" />
      <Stack.Screen name="notification-detail" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="about" />
      <Stack.Screen name="help-support" />
      <Stack.Screen name="logout" options={{ presentation: "modal" }} />
    </Stack>
  );
}
