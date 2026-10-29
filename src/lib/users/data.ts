import { createClient } from "@/lib/supabase/server";
import { mapSystemUserRow } from "@/lib/users/format";
import type { SystemUser } from "@/types/user";

export async function getSystemUsers(): Promise<SystemUser[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("system_users")
      .select("*")
      .neq("role", "admin")
      .neq("role", "administrator")
      .order("created_at", { ascending: false });

    if (error || !data?.length) return [];
    return data
      .map(mapSystemUserRow)
      .sort((a, b) => Number(Boolean(a.archivedAt)) - Number(Boolean(b.archivedAt)));
  } catch {
    return [];
  }
}
