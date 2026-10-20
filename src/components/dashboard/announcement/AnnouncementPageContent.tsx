"use client";

import { Plus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import AnnouncementDetailsModal from "./AnnouncementDetailsModal";
import AnnouncementFormModal from "./AnnouncementFormModal";
import AnnouncementKpiCards from "./AnnouncementKpiCards";
import AnnouncementTable from "./AnnouncementTable";
import DeleteAnnouncementModal from "./DeleteAnnouncementModal";
import { computeAnnouncementStats } from "@/lib/announcement/stats";
import type { Announcement } from "@/types/announcement";

type Props = { initialAnnouncements: Announcement[] };

export default function AnnouncementPageContent({
  initialAnnouncements,
}: Props) {
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editing, setEditing] = useState<Announcement | undefined>();
  const [viewing, setViewing] = useState<Announcement | null>(null);
  const [deleting, setDeleting] = useState<Announcement | null>(null);

  const stats = useMemo(
    () => computeAnnouncementStats(announcements),
    [announcements]
  );

  const openAdd = useCallback(() => {
    setFormMode("add");
    setEditing(undefined);
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((announcement: Announcement) => {
    setFormMode("edit");
    setEditing(announcement);
    setFormOpen(true);
  }, []);

  const handleSave = useCallback((announcement: Announcement) => {
    setAnnouncements((prev) => {
      const idx = prev.findIndex((a) => a.id === announcement.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = announcement;
        return next.sort(
          (a, b) =>
            new Date(b.publishedAt ?? b.created_at).getTime() -
            new Date(a.publishedAt ?? a.created_at).getTime()
        );
      }
      return [announcement, ...prev];
    });
  }, []);

  const handleDelete = useCallback((id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const handleViewsUpdated = useCallback((announcement: Announcement) => {
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === announcement.id ? announcement : a))
    );
    setViewing((v) => (v?.id === announcement.id ? announcement : v));
  }, []);

  return (
    <>
      <div className="announcements-page flex h-full flex-col gap-3 overflow-hidden">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold text-gray-900 sm:text-base">
              Announcement Management
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Create, schedule, and publish announcements for residents and staff
              about collection schedules, notices, and guidelines across Jasaan.
            </p>
          </div>
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-eco-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-eco-dark"
          >
            <Plus className="h-4 w-4" />
            New Announcement
          </button>
        </div>

        <AnnouncementKpiCards stats={stats} />

        <div className="min-h-0 flex-1">
          <AnnouncementTable
            announcements={announcements}
            onView={setViewing}
            onEdit={openEdit}
            onDelete={setDeleting}
          />
        </div>
      </div>

      <AnnouncementFormModal
        mode={formMode}
        announcement={editing}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={handleSave}
      />

      <AnnouncementDetailsModal
        announcement={viewing}
        open={!!viewing}
        onClose={() => setViewing(null)}
        onEdit={openEdit}
        onDelete={setDeleting}
        onViewsUpdated={handleViewsUpdated}
      />

      <DeleteAnnouncementModal
        announcement={deleting}
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onSuccess={handleDelete}
      />
    </>
  );
}
