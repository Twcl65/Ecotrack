"use server";

import { createClient } from "@/lib/supabase/server";

/** Resolve username or email to the Supabase Auth email for sign-in. */
export async function resolveLoginEmail(identifier: string): Promise<string> {
  const trimmed = identifier.trim();
  if (trimmed.includes("@")) return trimmed.toLowerCase();

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("system_users")
      .select("email")
      .eq("username", trimmed)
      .maybeSingle();

    if (data?.email) return data.email.toLowerCase();
  } catch {
    // Fall through to legacy local email format.
  }

  return `${trimmed}@ecotrack.local`;
}
