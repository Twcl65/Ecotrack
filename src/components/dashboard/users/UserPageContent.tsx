"use client";

import { Plus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import DeactivateUserModal from "./DeactivateUserModal";
import UserDetailsModal from "./UserDetailsModal";
import UserFormModal from "./UserFormModal";
import UserKpiCards from "./UserKpiCards";
import UserTable from "./UserTable";
import { computeUserStats } from "@/lib/users/stats";
import type { SystemUser } from "@/types/user";

type Props = { initialUsers: SystemUser[] };

export default function UserPageContent({ initialUsers }: Props) {
  const [users, setUsers] = useState(initialUsers);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editing, setEditing] = useState<SystemUser | undefined>();
  const [viewing, setViewing] = useState<SystemUser | null>(null);
  const [deactivating, setDeactivating] = useState<SystemUser | null>(null);

  const stats = useMemo(() => computeUserStats(users), [users]);

  const openAdd = useCallback(() => {
    setFormMode("add");
    setEditing(undefined);
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((user: SystemUser) => {
    setFormMode("edit");
    setEditing(user);
    setFormOpen(true);
  }, []);

  const handleSave = useCallback((user: SystemUser) => {
    setUsers((prev) => {
      const idx = prev.findIndex((u) => u.id === user.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = user;
        return next.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      return [user, ...prev];
    });
    setViewing((v) => (v?.id === user.id ? user : v));
  }, []);

  const handleUpdated = useCallback((user: SystemUser) => {
    setUsers((prev) => prev.map((u) => (u.id === user.id ? user : u)));
    setViewing((v) => (v?.id === user.id ? user : v));
  }, []);

  const handleDeactivate = useCallback((user: SystemUser) => {
    handleUpdated(user);
  }, [handleUpdated]);

  return (
    <>
      <div className="users-page flex h-full flex-col gap-3 overflow-hidden">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold text-gray-900 sm:text-base">
              User Management
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Manage administrator, driver, and resident accounts across the
              ECOTRACK system.
            </p>
          </div>
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-eco-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-eco-dark"
          >
            <Plus className="h-4 w-4" />
            Add New User
          </button>
        </div>

        <UserKpiCards stats={stats} />

        <div className="min-h-0 flex-1">
          <UserTable
            users={users}
            onView={setViewing}
            onEdit={openEdit}
            onDelete={setDeactivating}
          />
        </div>
      </div>

      <UserFormModal
        mode={formMode}
        user={editing}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={handleSave}
      />

      <UserDetailsModal
        user={viewing}
        open={!!viewing}
        onClose={() => setViewing(null)}
        onEdit={openEdit}
        onDeactivate={setDeactivating}
        onUpdated={handleUpdated}
      />

      <DeactivateUserModal
        user={deactivating}
        open={!!deactivating}
        onClose={() => setDeactivating(null)}
        onSuccess={handleDeactivate}
      />
    </>
  );
}
