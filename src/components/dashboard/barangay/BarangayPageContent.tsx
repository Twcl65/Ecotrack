"use client";

import { useCallback, useState } from "react";
import BarangayFormModal from "./BarangayFormModal";
import BarangayTable from "./BarangayTable";
import DeleteBarangayModal from "./DeleteBarangayModal";
import type { Barangay } from "@/types/barangay";

type Props = { initialBarangays: Barangay[] };

export default function BarangayPageContent({ initialBarangays }: Props) {
  const [barangays, setBarangays] = useState(initialBarangays);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editing, setEditing] = useState<Barangay | undefined>();
  const [deleting, setDeleting] = useState<Barangay | null>(null);

  const openAdd = useCallback(() => {
    setFormMode("add");
    setEditing(undefined);
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((barangay: Barangay) => {
    setFormMode("edit");
    setEditing(barangay);
    setFormOpen(true);
  }, []);

  const handleSave = useCallback((barangay: Barangay) => {
    setBarangays((prev) => {
      const idx = prev.findIndex((b) => b.id === barangay.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = barangay;
        return next.sort((a, b) => a.name.localeCompare(b.name));
      }
      return [...prev, barangay].sort((a, b) => a.name.localeCompare(b.name));
    });
  }, []);

  const handleDelete = useCallback((id: string) => {
    setBarangays((prev) => prev.filter((b) => b.id !== id));
  }, []);

  return (
    <>
      <div className="flex h-full flex-col overflow-hidden">
        <div className="min-h-0 flex-1">
          <BarangayTable
            barangays={barangays}
            onAdd={openAdd}
            onEdit={openEdit}
            onDelete={setDeleting}
          />
        </div>
      </div>

      <BarangayFormModal
        mode={formMode}
        barangay={editing}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={handleSave}
      />

      <DeleteBarangayModal
        barangay={deleting}
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onSuccess={handleDelete}
      />
    </>
  );
}
