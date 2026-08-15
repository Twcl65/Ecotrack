import { supabase } from "../supabase";

export type AnnouncementItem = {
  id: string;
  title: string;
  content: string;
  dateLabel: string;
  type: string;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export async function fetchAnnouncements(): Promise<AnnouncementItem[]> {
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  const now = Date.now();
  return data
    .filter((row) => {
      const publishedAt = row.published_at ?? row.created_at;
      if (new Date(publishedAt).getTime() > now) return false;
      if (row.expires_at && new Date(row.expires_at).getTime() < now) return false;
      return true;
    })
    .map((row) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      dateLabel: formatDate(row.published_at ?? row.created_at),
      type: row.announcement_type ?? "general",
    }));
}
