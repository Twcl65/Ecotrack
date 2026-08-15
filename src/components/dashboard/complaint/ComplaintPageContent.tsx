"use client";

import { useCallback, useMemo, useState } from "react";
import ComplaintDetailsModal from "./ComplaintDetailsModal";
import ComplaintFormModal from "./ComplaintFormModal";
import ComplaintKpiCards from "./ComplaintKpiCards";
import ComplaintTable from "./ComplaintTable";
import DeleteComplaintModal from "./DeleteComplaintModal";
import { computeComplaintStats } from "@/lib/complaint/stats";
import type { Complaint } from "@/types/complaint";

type Props = {
  initialComplaints: Complaint[];
  barangayOptions: string[];
};

export default function ComplaintPageContent({
  initialComplaints,
  barangayOptions,
}: Props) {
  const [complaints, setComplaints] = useState(initialComplaints);
  const [viewing, setViewing] = useState<Complaint | null>(null);
  const [editing, setEditing] = useState<Complaint | null>(null);
  const [deleting, setDeleting] = useState<Complaint | null>(null);

  const stats = useMemo(
    () => computeComplaintStats(complaints),
    [complaints]
  );

  const handleUpdate = useCallback((complaint: Complaint) => {
    setComplaints((prev) => {
      const idx = prev.findIndex((c) => c.id === complaint.id);
      if (idx < 0) return prev;
      const next = [...prev];
      next[idx] = complaint;
      return next.sort(
        (a, b) =>
          new Date(b.filedAt).getTime() - new Date(a.filedAt).getTime()
      );
    });
    setViewing((v) => (v?.id === complaint.id ? complaint : v));
    setEditing((e) => (e?.id === complaint.id ? complaint : e));
  }, []);

  const handleDelete = useCallback((id: string) => {
    setComplaints((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return (
    <>
      <div className="complaints-page flex h-full flex-col gap-3 overflow-hidden">
        <ComplaintKpiCards stats={stats} />
        <ComplaintTable
          complaints={complaints}
          barangayOptions={barangayOptions}
          onView={setViewing}
          onEdit={setEditing}
          onDelete={setDeleting}
        />
      </div>

      <ComplaintDetailsModal
        complaint={viewing}
        open={!!viewing}
        onClose={() => setViewing(null)}
        onSuccess={handleUpdate}
      />

      <ComplaintFormModal
        complaint={editing ?? undefined}
        barangayOptions={barangayOptions}
        open={!!editing}
        onClose={() => setEditing(null)}
        onSuccess={handleUpdate}
      />

      <DeleteComplaintModal
        complaint={deleting}
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onSuccess={handleDelete}
      />
    </>
  );
}
