import AnnouncementPageContent from "@/components/dashboard/announcement/AnnouncementPageContent";
import { getAnnouncements } from "@/lib/announcement/data";

export default async function AnnouncementPage() {
  const announcements = await getAnnouncements();

  return <AnnouncementPageContent initialAnnouncements={announcements} />;
}
