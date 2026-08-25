export type SiteMetrics = {
  id: number;
  total_routes: number;
  active_collections: number;
  total_distance_km: number;
  updated_at: string;
};

export type FeatureCard = {
  id: string;
  title: string;
  description: string;
  icon_type: "route" | "collection" | "analytics";
  sort_order: number;
  created_at: string;
};

export type DashboardKpisRow = {
  id: number;
  todays_collection: number;
  total_barangay: number;
  total_complaint: number;
  waste_collected_kg: number;
  updated_at: string;
};

export type CollectionTrendRow = {
  id: string;
  collection_date: string;
  label: string;
  collections: number;
};

export type CollectionStatusRow = {
  id: string;
  status: string;
  label: string;
  count: number;
  percentage: number;
  color: string;
  sort_order: number;
};

export type WeeklyScheduleRow = {
  id: string;
  day_label: string;
  date_label: string;
  barangay: string;
  status: string;
  sort_order: number;
};

export type AnnouncementRow = {
  id: string;
  title: string;
  content: string;
  subtitle: string;
  announcement_type: string;
  audience: string;
  publish_status: string;
  published_at: string | null;
  expires_at: string | null;
  views: number;
  created_at: string;
  updated_at: string;
};

export type CollectionScheduleRow = {
  id: string;
  barangay: string;
  collection_date: string;
  route_id: string | null;
  time_start: string | null;
  time_end: string | null;
  driver: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type BarangayRow = {
  id: string;
  name: string;
  population: number;
  status: string;
  created_at: string;
  updated_at: string;
};

export type ComplaintRow = {
  id: string;
  complaint_code: string;
  complainant_name: string;
  phone: string;
  barangay: string;
  issue: string;
  status: string;
  filed_at: string;
  attachment_url: string | null;
  created_at: string;
  updated_at: string;
};

export type GeneratedReportRow = {
  id: string;
  report_name: string;
  report_type: string;
  period_label: string;
  generated_by: string;
  generated_at: string;
  from_date: string;
  to_date: string;
  barangay_filter: string | null;
  created_at: string;
};

export type SystemUserRow = {
  id: string;
  user_code: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  username: string;
  status: string;
  avatar_url: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
};

export type RouteRow = {
  id: string;
  name: string;
  distance_km: number;
  status: string;
  route_code: string | null;
  barangay: string | null;
  area: string | null;
  driver_name: string | null;
  vehicle_id: string | null;
  estimated_minutes: number | null;
  created_at: string;
};

export type RouteStopRow = {
  id: string;
  route_id: string;
  stop_order: number;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  status: string;
  created_at: string;
};

export type CollectionRow = {
  id: string;
  route_id: string | null;
  driver_name: string | null;
  status: string;
  started_at: string;
  completed_at: string | null;
};

export type AppSettingsRow = {
  id: number;
  system_name: string;
  system_tagline: string;
  timezone: string;
  date_format: string;
  time_format: string;
  language: string;
  items_per_page: number;
  maintenance_mode: boolean;
  session_timeout_minutes: number;
  enable_audit_log: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  complaint_alerts: boolean;
  schedule_reminders: boolean;
  auto_backup_enabled: boolean;
  backup_frequency: string;
  backup_retention_days: number;
  require_strong_password: boolean;
  two_factor_enabled: boolean;
  login_attempt_limit: number;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      site_metrics: {
        Row: SiteMetrics;
        Insert: Omit<SiteMetrics, "updated_at"> & { updated_at?: string };
        Update: Partial<SiteMetrics>;
        Relationships: [];
      };
      feature_cards: {
        Row: FeatureCard;
        Insert: Omit<FeatureCard, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<FeatureCard>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          username: string | null;
          full_name: string | null;
          role: string;
          created_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          full_name?: string | null;
          role?: string;
        };
        Update: {
          username?: string | null;
          full_name?: string | null;
          role?: string;
        };
        Relationships: [];
      };
      dashboard_kpis: {
        Row: DashboardKpisRow;
        Insert: Omit<DashboardKpisRow, "updated_at"> & { updated_at?: string };
        Update: Partial<DashboardKpisRow>;
        Relationships: [];
      };
      collection_trends: {
        Row: CollectionTrendRow;
        Insert: Omit<CollectionTrendRow, "id"> & { id?: string };
        Update: Partial<CollectionTrendRow>;
        Relationships: [];
      };
      collection_status_summary: {
        Row: CollectionStatusRow;
        Insert: Omit<CollectionStatusRow, "id"> & { id?: string };
        Update: Partial<CollectionStatusRow>;
        Relationships: [];
      };
      weekly_schedules: {
        Row: WeeklyScheduleRow;
        Insert: Omit<WeeklyScheduleRow, "id"> & { id?: string };
        Update: Partial<WeeklyScheduleRow>;
        Relationships: [];
      };
      announcements: {
        Row: AnnouncementRow;
        Insert: Omit<
          AnnouncementRow,
          "id" | "created_at" | "updated_at" | "views"
        > & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          views?: number;
          subtitle?: string;
          announcement_type?: string;
          audience?: string;
          publish_status?: string;
          published_at?: string | null;
          expires_at?: string | null;
        };
        Update: Partial<AnnouncementRow>;
        Relationships: [];
      };
      collection_schedules: {
        Row: CollectionScheduleRow;
        Insert: Omit<CollectionScheduleRow, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<CollectionScheduleRow>;
        Relationships: [];
      };
      barangays: {
        Row: BarangayRow;
        Insert: Omit<BarangayRow, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<BarangayRow>;
        Relationships: [];
      };
      complaints: {
        Row: ComplaintRow;
        Insert: Omit<
          ComplaintRow,
          "id" | "created_at" | "updated_at"
        > & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<ComplaintRow>;
        Relationships: [];
      };
      generated_reports: {
        Row: GeneratedReportRow;
        Insert: Omit<GeneratedReportRow, "id" | "created_at" | "generated_at"> & {
          id?: string;
          created_at?: string;
          generated_at?: string;
        };
        Update: Partial<GeneratedReportRow>;
        Relationships: [];
      };
      system_users: {
        Row: SystemUserRow;
        Insert: Omit<
          SystemUserRow,
          "id" | "created_at" | "updated_at" | "last_login_at"
        > & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          phone?: string;
          status?: string;
          avatar_url?: string | null;
          last_login_at?: string | null;
        };
        Update: Partial<SystemUserRow>;
        Relationships: [];
      };
      routes: {
        Row: RouteRow;
        Insert: Omit<RouteRow, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
          route_code?: string | null;
          barangay?: string | null;
          area?: string | null;
          driver_name?: string | null;
          vehicle_id?: string | null;
          estimated_minutes?: number | null;
        };
        Update: Partial<RouteRow>;
        Relationships: [];
      };
      route_stops: {
        Row: RouteStopRow;
        Insert: Omit<RouteStopRow, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
          description?: string | null;
        };
        Update: Partial<RouteStopRow>;
        Relationships: [];
      };
      collections: {
        Row: CollectionRow;
        Insert: Omit<CollectionRow, "id" | "started_at"> & {
          id?: string;
          started_at?: string;
          route_id?: string | null;
          driver_name?: string | null;
          completed_at?: string | null;
        };
        Update: Partial<CollectionRow>;
        Relationships: [];
      };
      app_settings: {
        Row: AppSettingsRow;
        Insert: Omit<AppSettingsRow, "updated_at"> & { updated_at?: string };
        Update: Partial<AppSettingsRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export const DEFAULT_METRICS: SiteMetrics = {
  id: 1,
  total_routes: 6,
  active_collections: 5,
  total_distance_km: 152.4,
  updated_at: new Date().toISOString(),
};

export const DEFAULT_FEATURES: FeatureCard[] = [
  {
    id: "1",
    title: "Route Management",
    description:
      "Plan and optimize waste collection routes across Jasaan. Assign drivers, set schedules, and monitor route performance in real time.",
    icon_type: "route",
    sort_order: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Collection Monitoring",
    description:
      "Track real-time collection activities, driver performance, and vehicle status. Ensure timely and efficient waste pickup across all barangays.",
    icon_type: "collection",
    sort_order: 2,
    created_at: new Date().toISOString(),
  },
  {
    id: "3",
    title: "Reporting & Analytics",
    description:
      "Generate comprehensive reports on collection efficiency, route coverage, and environmental impact. Make data-driven decisions for a cleaner community.",
    icon_type: "analytics",
    sort_order: 3,
    created_at: new Date().toISOString(),
  },
];
