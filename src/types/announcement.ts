export type AnnouncementType =
  | "schedule"
  | "notice"
  | "general"
  | "guidelines";

export type AnnouncementDisplayStatus = "active" | "scheduled" | "expired";

export type AnnouncementAudience =
  | "all_residents"
  | "barangay_residents"
  | "staff";

export type PublishStatus = "scheduled" | "publish_now";

export type Announcement = {
  id: string;
  title: string;
  subtitle: string;
  content: string;
  type: AnnouncementType;
  audience: AnnouncementAudience;
  publishStatus: PublishStatus;
  status: AnnouncementDisplayStatus;
  publishedAt: string | null;
  expiresAt: string | null;
  views: number;
  postedDateLabel: string;
  postedTimeLabel: string;
  expiryDateLabel: string | null;
  expiryTimeLabel: string | null;
  created_at: string;
  updated_at: string;
};

export type AnnouncementFormValues = {
  title: string;
  type: AnnouncementType;
  audience: AnnouncementAudience;
  message: string;
  publishDate: string;
  publishTime: string;
  expiryDate: string;
  expiryTime: string;
  publishStatus: PublishStatus;
};

export type AnnouncementStats = {
  totalThisMonth: number;
  active: number;
  scheduled: number;
  expired: number;
  totalViewsThisMonth: number;
};

export const ANNOUNCEMENT_TYPE_OPTIONS: {
  value: AnnouncementType;
  label: string;
}[] = [
  { value: "schedule", label: "Schedule" },
  { value: "notice", label: "Notice" },
  { value: "general", label: "General" },
  { value: "guidelines", label: "Guidelines" },
];

export const ANNOUNCEMENT_AUDIENCE_OPTIONS: {
  value: AnnouncementAudience;
  label: string;
}[] = [
  { value: "all_residents", label: "All Residents" },
  { value: "barangay_residents", label: "Barangay Residents" },
  { value: "staff", label: "Staff" },
];

export const ANNOUNCEMENT_TYPE_CONFIG: Record<
  AnnouncementType,
  { label: string; className: string; subtitle: string }
> = {
  schedule: {
    label: "Schedule",
    className: "bg-emerald-100 text-emerald-800",
    subtitle: "Collection Schedule Update",
  },
  notice: {
    label: "Notice",
    className: "bg-blue-100 text-blue-800",
    subtitle: "Notice",
  },
  general: {
    label: "General",
    className: "bg-gray-100 text-gray-700",
    subtitle: "General",
  },
  guidelines: {
    label: "Guidelines",
    className: "bg-orange-100 text-orange-800",
    subtitle: "Guidelines",
  },
};

export const ANNOUNCEMENT_STATUS_CONFIG: Record<
  AnnouncementDisplayStatus,
  { label: string; className: string }
> = {
  active: {
    label: "Active",
    className: "bg-emerald-100 text-emerald-800",
  },
  scheduled: {
    label: "Scheduled",
    className: "bg-orange-100 text-orange-800",
  },
  expired: {
    label: "Expired",
    className: "bg-gray-100 text-gray-600",
  },
};
