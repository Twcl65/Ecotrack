import { Ionicons } from "@expo/vector-icons";
import type { ThemeColors } from "@/constants/theme";

export type AnnouncementType = "general" | "notice" | "schedule" | "guidelines";

export function normalizeAnnouncementType(type: string): AnnouncementType {
  switch (type) {
    case "schedule":
    case "notice":
    case "guidelines":
      return type;
    default:
      return "general";
  }
}

type TypeConfig = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: (colors: ThemeColors) => string;
};

export const ANNOUNCEMENT_TYPE_CONFIG: Record<AnnouncementType, TypeConfig> = {
  general: {
    label: "General",
    icon: "document-text-outline",
    color: "#6b7280",
    bg: (colors) => `${colors.textMuted}22`,
  },
  notice: {
    label: "Notice",
    icon: "alert-circle-outline",
    color: "#3b82f6",
    bg: () => "#3b82f622",
  },
  schedule: {
    label: "Schedule",
    icon: "calendar-outline",
    color: "#059669",
    bg: () => "#05966922",
  },
  guidelines: {
    label: "Guidelines",
    icon: "book-outline",
    color: "#ea580c",
    bg: () => "#ea580c22",
  },
};

export function getAnnouncementTypeConfig(type: string) {
  return ANNOUNCEMENT_TYPE_CONFIG[normalizeAnnouncementType(type)];
}
