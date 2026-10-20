import type { Complaint, ComplaintStats } from "@/types/complaint";

export function computeComplaintStats(complaints: Complaint[]): ComplaintStats {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  return complaints.reduce<ComplaintStats>(
    (acc, c) => {
      const filed = new Date(c.filedAt);
      if (filed >= monthStart) acc.totalThisMonth += 1;

      switch (c.status) {
        case "pending":
          acc.pending += 1;
          break;
        case "in_progress":
          acc.inProgress += 1;
          break;
        case "resolved":
          acc.resolved += 1;
          break;
        case "declined":
          acc.declined += 1;
          break;
      }
      return acc;
    },
    {
      totalThisMonth: 0,
      pending: 0,
      inProgress: 0,
      resolved: 0,
      declined: 0,
    }
  );
}
