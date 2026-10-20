"use client";

import { Calendar, Eye, Megaphone, Pencil, Trash2, Users, X } from "lucide-react";
import { useEffect } from "react";
import { incrementAnnouncementViews } from "@/app/dashboard/announcement/actions";
import { AnnouncementStatusBadge } from "./AnnouncementBadges";
import type { Announcement } from "@/types/announcement";
import { ANNOUNCEMENT_AUDIENCE_OPTIONS, ANNOUNCEMENT_TYPE_CONFIG } from "@/types/announcement";

type Props = {
  announcement: Announcement | null;
  open: boolean;
  onClose: () => void;
  onEdit: (announcement: Announcement) => void;
  onDelete: (announcement: Announcement) => void;
  onViewsUpdated: (announcement: Announcement) => void;
};

export default function AnnouncementDetailsModal({
  announcement,
  open,
  onClose,
  onEdit,
  onDelete,
  onViewsUpdated,
}: Props) {
  useEffect(() => {
    if (!open || !announcement) return;
    incrementAnnouncementViews(announcement.id).then((result) => {
      if (result.success && result.announcement) {
        onViewsUpdated(result.announcement);
      }
    });
  }, [open, announcement?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open || !announcement) return null;

  const audienceLabel =
    ANNOUNCEMENT_AUDIENCE_OPTIONS.find((o) => o.value === announcement.audience)
      ?.label ?? announcement.audience;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-lg font-bold text-gray-900">Announcement Details</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 py-4">
          <div className="mb-4 flex items-center justify-center rounded-xl bg-eco-light py-8">
            <Megaphone className="h-16 w-16 text-eco-primary" strokeWidth={1.5} />
          </div>

          <div className="mb-3">
            <AnnouncementStatusBadge status={announcement.status} />
          </div>

          <h3 className="text-lg font-bold text-gray-900">{announcement.title}</h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            Posted on {announcement.postedDateLabel} at {announcement.postedTimeLabel}
          </p>

          <div className="mt-4 border-t border-gray-100 pt-4">
            <p className="mb-1 text-sm font-bold text-gray-900">Message</p>
            <p className="text-sm text-gray-700">{announcement.content}</p>
          </div>

          <ul className="mt-4 space-y-3 border-t border-gray-100 pt-4">
            <MetaRow
              icon={Calendar}
              label="Type"
              value={ANNOUNCEMENT_TYPE_CONFIG[announcement.type].label}
            />
            <MetaRow
              icon={Calendar}
              label="Expiry Date"
              value={
                announcement.expiryDateLabel
                  ? `${announcement.expiryDateLabel} at ${announcement.expiryTimeLabel}`
                  : "No expiry"
              }
            />
            <MetaRow icon={Users} label="Audience" value={audienceLabel} />
            <MetaRow
              icon={Eye}
              label="Total Views"
              value={String(announcement.views)}
            />
          </ul>
        </div>

        <div className="flex gap-2 border-t border-gray-100 px-5 py-4">
          <button
            type="button"
            onClick={() => {
              onClose();
              onEdit(announcement);
            }}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-eco-primary px-4 py-2 text-sm font-semibold text-eco-primary hover:bg-eco-light"
          >
            <Pencil className="h-4 w-4" />
            Edit Announcement
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onDelete(announcement);
            }}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-500 px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            Delete Announcement
          </button>
        </div>
      </div>
    </div>
  );
}

function MetaRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Calendar;
  label: string;
  value: string;
}) {
  return (
    <li className="flex items-center justify-between gap-3 text-sm">
      <div className="flex items-center gap-2 text-gray-600">
        <Icon className="h-4 w-4 text-gray-400" />
        <span>{label}</span>
      </div>
      <span className="font-medium text-gray-900">{value}</span>
    </li>
  );
}
