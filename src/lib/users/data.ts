import { createClient } from "@/lib/supabase/server";
import { mapSystemUserRow } from "@/lib/users/format";
import type { SystemUser } from "@/types/user";

export async function getSystemUsers(): Promise<SystemUser[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("system_users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data?.length) return [];
    return data.map(mapSystemUserRow);
  } catch {
    return [];
  }
}
