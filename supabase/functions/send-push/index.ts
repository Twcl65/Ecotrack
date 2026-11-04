type PushEvent = {
  id: number;
  recipient_role: "administrator" | "driver" | "viewer" | null;
  recipient_user_id: string | null;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
};

type DatabaseWebhookPayload = {
  type?: string;
  table?: string;
  schema?: string;
  record?: PushEvent;
};

type PushTokenRow = {
  expo_push_token: string;
};

type ExpoTicket = {
  status?: string;
  details?: { error?: string };
};

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

Deno.serve(async (request: Request) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const expectedSecret = Deno.env.get("PUSH_WEBHOOK_SECRET");
  if (!expectedSecret) {
    console.error("PUSH_WEBHOOK_SECRET is not configured.");
    return new Response("Push webhook is not configured", { status: 500 });
  }

  const expectedAuthorization = `Bearer ${expectedSecret}`;
  if (!constantTimeEqual(request.headers.get("authorization") ?? "", expectedAuthorization)) {
    return new Response("Unauthorized", { status: 401 });
  }

  let payload: DatabaseWebhookPayload;
  try {
    payload = (await request.json()) as DatabaseWebhookPayload;
  } catch {
    return new Response("Invalid JSON payload", { status: 400 });
  }

  if (
    payload.type !== "INSERT" ||
    payload.table !== "push_events" ||
    payload.schema !== "public" ||
    !isPushEvent(payload.record)
  ) {
    return new Response("Unsupported database event", { status: 400 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Supabase service credentials are not configured.");
    return new Response("Push sender is not configured", { status: 500 });
  }

  try {
    const tokens = await loadTokens(
      supabaseUrl,
      serviceRoleKey,
      payload.record
    );
    if (tokens.length === 0) return Response.json({ sent: 0 });

    let sent = 0;
    for (let offset = 0; offset < tokens.length; offset += 100) {
      const batch = tokens.slice(offset, offset + 100);
      const response = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          batch.map(({ expo_push_token }) => ({
            to: expo_push_token,
            title: payload.record!.title,
            body: payload.record!.body,
            data: payload.record!.data ?? {},
            sound: "default",
            priority: "high",
            channelId: "default",
          }))
        ),
      });

      if (!response.ok) {
        const detail = await response.text();
        console.error("Expo push gateway rejected the request:", response.status, detail);
        return new Response("Push delivery failed", { status: 502 });
      }

      const result = (await response.json()) as {
        data?: ExpoTicket[];
      };
      const invalidTokens = batch.filter(
        (_, index) =>
          result.data?.[index]?.details?.error === "DeviceNotRegistered"
      );
      if (invalidTokens.length > 0) {
        await removeInvalidTokens(
          supabaseUrl,
          serviceRoleKey,
          invalidTokens.map((token) => token.expo_push_token)
        );
      }
      sent += batch.length - invalidTokens.length;
    }

    return Response.json({ sent });
  } catch (error) {
    console.error("Could not deliver push notification:", error);
    return new Response("Push delivery failed", { status: 502 });
  }
});

function isPushEvent(value: unknown): value is PushEvent {
  if (!value || typeof value !== "object") return false;
  const event = value as Partial<PushEvent>;
  return (
    typeof event.title === "string" &&
    typeof event.body === "string" &&
    (typeof event.recipient_user_id === "string" ||
      typeof event.recipient_role === "string")
  );
}

async function loadTokens(
  supabaseUrl: string,
  serviceRoleKey: string,
  event: PushEvent
): Promise<PushTokenRow[]> {
  const url = new URL("/rest/v1/push_tokens", supabaseUrl);
  url.searchParams.set("select", "expo_push_token");
  if (event.recipient_user_id) {
    url.searchParams.set("user_id", `eq.${event.recipient_user_id}`);
  } else if (event.recipient_role) {
    url.searchParams.set("role", `eq.${event.recipient_role}`);
  }

  const response = await fetch(url, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
  });
  if (!response.ok) {
    throw new Error(`Could not load push tokens: ${response.status} ${await response.text()}`);
  }
  return (await response.json()) as PushTokenRow[];
}

async function removeInvalidTokens(
  supabaseUrl: string,
  serviceRoleKey: string,
  tokens: string[]
): Promise<void> {
  const url = new URL("/rest/v1/push_tokens", supabaseUrl);
  url.searchParams.set("expo_push_token", `in.(${tokens.join(",")})`);

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Prefer: "return=minimal",
    },
  });
  if (!response.ok) {
    console.error("Could not remove expired push tokens:", response.status, await response.text());
  }
}

function constantTimeEqual(left: string, right: string): boolean {
  const encoder = new TextEncoder();
  const leftBytes = encoder.encode(left);
  const rightBytes = encoder.encode(right);
  let difference = leftBytes.length ^ rightBytes.length;
  const length = Math.max(leftBytes.length, rightBytes.length);
  for (let index = 0; index < length; index += 1) {
    difference |=
      (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
  }
  return difference === 0;
}
