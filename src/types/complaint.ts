export type ComplaintStatus =
  | "pending"
  | "in_progress"
  | "resolved"
  | "declined";

export type Complaint = {
  id: string;
  complaintCode: string;
  complainantName: string;
  phone: string;
  barangay: string;
  issue: string;
  status: ComplaintStatus;
  filedAt: string;
  dateLabel: string;
  timeLabel: string;
  attachmentUrl: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ComplaintFormValues = {
  complainantName: string;
  phone: string;
  barangay: string;
  issue: string;
  status: ComplaintStatus;
  filedDate: string;
  filedTime: string;
  attachmentUrl: string;
};

export type ComplaintStats = {
  totalThisMonth: number;
  pending: number;
  inProgress: number;
  resolved: number;
  declined: number;
};

export const COMPLAINT_STATUS_CONFIG: Record<
  ComplaintStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "Pending",
    className: "bg-orange-100 text-orange-800",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-blue-100 text-blue-800",
  },
  resolved: {
    label: "Resolved",
    className: "bg-emerald-100 text-emerald-800",
  },
  declined: {
    label: "Declined",
    className: "bg-gray-100 text-gray-600",
  },
};

export const COMPLAINT_STATUS_OPTIONS: { value: ComplaintStatus; label: string }[] =
  [
    { value: "pending", label: "Pending" },
    { value: "in_progress", label: "In Progress" },
    { value: "resolved", label: "Resolved" },
    { value: "declined", label: "Declined" },
  ];
