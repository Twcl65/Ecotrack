import type { Announcement, AnnouncementStats } from "@/types/announcement";

export function computeAnnouncementStats(
  announcements: Announcement[]
): AnnouncementStats {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  return announcements.reduce<AnnouncementStats>(
    (acc, item) => {
      const posted = new Date(item.publishedAt ?? item.created_at);
      if (posted >= monthStart) {
        acc.totalThisMonth += 1;
        acc.totalViewsThisMonth += item.views;
      }

      switch (item.status) {
        case "active":
          acc.active += 1;
          break;
        case "scheduled":
          acc.scheduled += 1;
          break;
        case "expired":
          acc.expired += 1;
          break;
      }

      return acc;
    },
    {
      totalThisMonth: 0,
      active: 0,
      scheduled: 0,
      expired: 0,
      totalViewsThisMonth: 0,
    }
  );
}
