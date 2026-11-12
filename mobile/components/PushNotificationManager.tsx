import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import { AppState } from "react-native";
import { useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { registerPushToken } from "@/lib/pushNotifications";

export default function PushNotificationManager() {
  const { session, profile } = useAuth();
  const router = useRouter();
  const handledResponseId = useRef<string | null>(null);
  const registeredAccount = useRef<string | null>(null);
  const registeringAccount = useRef<string | null>(null);

  useEffect(() => {
    if (!session?.user || !profile) {
      registeredAccount.current = null;
      registeringAccount.current = null;
      return;
    }
    const accountKey = `${session.user.id}:${profile.role}`;
    const userId = session.user.id;
    const role = profile.role;
    let active = true;

    async function registerToken() {
      if (
        registeredAccount.current === accountKey ||
        registeringAccount.current === accountKey
      ) {
        return;
      }

      registeringAccount.current = accountKey;
      try {
        const result = await registerPushToken(userId, role);
        if (!active) return;
        if (result.error) {
          console.warn(result.error);
          return;
        }
        registeredAccount.current = accountKey;
      } catch (error: unknown) {
        if (active) {
          console.warn(
            "Could not set up push notifications:",
            error instanceof Error ? error.message : error
          );
        }
      } finally {
        if (registeringAccount.current === accountKey) {
          registeringAccount.current = null;
        }
      }
    }

    void registerToken();
    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void registerToken();
    });

    return () => {
      active = false;
      appStateSubscription.remove();
    };
  }, [profile, session?.user]);

  const processNotificationResponse = useCallback(
    (response: Notifications.NotificationResponse | null) => {
      if (!response || !session || !profile) return;

      const responseId = response.notification.request.identifier;
      if (handledResponseId.current === responseId) return;
      handledResponseId.current = responseId;
      void Notifications.clearLastNotificationResponseAsync().catch((error: unknown) => {
        console.warn("Could not clear the handled notification response:", error);
      });

      const content = response.notification.request.content;
      const data = content.data;
      const isDriver = profile.role === "driver";
      const kind = typeof data.kind === "string" ? data.kind : "notification";
      const id = typeof data.id === "string" ? data.id : "";

      if (kind === "announcement" && id) {
        router.push({
          pathname: isDriver
            ? "/(app)/(driver)/announcement-detail"
            : "/(app)/(resident)/announcement-detail",
          params: { id },
        } as never);
        return;
      }

      if (kind === "schedule" && id) {
        router.push(
          isDriver
            ? {
                pathname: "/(app)/(driver)/schedule-detail",
                params: { id },
              } as never
            : "/(app)/(resident)/(tabs)/schedule" as never
        );
        return;
      }

      if (kind === "complaint" && id && !isDriver) {
        router.push({
          pathname: "/(app)/(resident)/complaint-detail",
          params: { id },
        } as never);
        return;
      }

      router.push({
        pathname: isDriver
          ? "/(app)/(driver)/notification-detail"
          : "/(app)/(resident)/notification-detail",
        params: {
          title: content.title ?? "ECOTRACK notification",
          details: content.body ?? "",
          timestamp: new Date(response.notification.date).toLocaleString(),
          type:
            typeof data.type === "string"
              ? data.type
              : kind === "schedule"
                ? "Collection"
                : kind === "complaint"
                  ? "Complaint"
                  : "Notification",
        },
      } as never);
    },
    [profile, router, session]
  );

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      processNotificationResponse
    );

    void Notifications.getLastNotificationResponseAsync().then(
      processNotificationResponse
    );

    return () => subscription.remove();
  }, [processNotificationResponse]);

  return null;
}
