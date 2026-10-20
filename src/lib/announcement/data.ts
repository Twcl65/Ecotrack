import { createClient } from "@/lib/supabase/server";
import { mapAnnouncementRow } from "@/lib/announcement/format";
import type { Announcement } from "@/types/announcement";

export async function getAnnouncements(): Promise<Announcement[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error || !data?.length) return [];
    return data.map(mapAnnouncementRow);
  } catch {
    return [];
  }
}
