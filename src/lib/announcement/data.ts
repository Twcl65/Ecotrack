import { createClient } from "@/lib/supabase/server";
import { mapAnnouncementRow } from "@/lib/announcement/format";
import type { Announcement } from "@/types/announcement";

export async function getAnnouncements(
  includeArchived = false
): Promise<Announcement[]> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from("announcements")
      .select("*")
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });
    if (!includeArchived) query = query.is("archived_at", null);
    const { data, error } = await query;

    if (error || !data?.length) return [];
    return data
      .map(mapAnnouncementRow)
      .sort((a, b) => Number(Boolean(a.archivedAt)) - Number(Boolean(b.archivedAt)));
  } catch {
    return [];
  }
}
