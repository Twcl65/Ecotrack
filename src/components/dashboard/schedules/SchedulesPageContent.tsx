"use client";

import { Plus } from "lucide-react";
import { useCallback, useState } from "react";
import DeleteScheduleModal from "./DeleteScheduleModal";
import ScheduleFormModal from "./ScheduleFormModal";
import SchedulesCalendarView from "./SchedulesCalendarView";
import SchedulesListView from "./SchedulesListView";
import type { Schedule } from "@/types/schedules";

type Tab = "list" | "calendar";

type Props = {
  initialSchedules: Schedule[];
  driverOptions: string[];
  barangayOptions: string[];
};

export default function SchedulesPageContent({
  initialSchedules,
  driverOptions,
  barangayOptions,
}: Props) {
  const [tab, setTab] = useState<Tab>("list");
  const [schedules, setSchedules] = useState(initialSchedules);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editingSchedule, setEditingSchedule] = useState<Schedule | undefined>();
  const [deletingSchedule, setDeletingSchedule] = useState<Schedule | null>(null);

  const openAdd = useCallback(() => {
    setFormMode("add");
    setEditingSchedule(undefined);
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((schedule: Schedule) => {
    setFormMode("edit");
    setEditingSchedule(schedule);
    setFormOpen(true);
  }, []);

  const openDelete = useCallback((schedule: Schedule) => {
    setDeletingSchedule(schedule);
  }, []);

  const handleCreateOrUpdate = useCallback((schedule: Schedule) => {
    setSchedules((prev) => {
      const idx = prev.findIndex((s) => s.id === schedule.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = schedule;
        return next.sort((a, b) => a.date.localeCompare(b.date));
      }
      return [...prev, schedule].sort((a, b) => a.date.localeCompare(b.date));
    });
  }, []);

  const handleDelete = useCallback((id: string) => {
    setSchedules((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return (
    <>
      <div className="schedules-page flex h-full flex-col overflow-hidden">
        <div className="mb-3 flex shrink-0 items-center justify-between border-b border-gray-200 pb-2">
          <div className="flex gap-6">
            <button
              type="button"
              onClick={() => setTab("list")}
              className={`pb-2 text-sm font-semibold transition ${
                tab === "list"
                  ? "border-b-2 border-eco-primary text-eco-primary"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Schedules List
            </button>
            <button
              type="button"
              onClick={() => setTab("calendar")}
              className={`pb-2 text-sm font-semibold transition ${
                tab === "calendar"
                  ? "border-b-2 border-eco-primary text-eco-primary"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Calendar View
            </button>
          </div>

          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 rounded-lg bg-eco-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-eco-dark"
          >
            <Plus className="h-4 w-4" />
            Add Schedule
          </button>
        </div>

        <div className="min-h-0 flex-1">
          {tab === "list" ? (
            <SchedulesListView
              schedules={schedules}
              onEdit={openEdit}
              onDelete={openDelete}
            />
          ) : (
            <SchedulesCalendarView schedules={schedules} />
          )}
        </div>
      </div>

      <ScheduleFormModal
        mode={formMode}
        schedule={editingSchedule}
        open={formOpen}
        driverOptions={driverOptions}
        barangayOptions={barangayOptions}
        onClose={() => setFormOpen(false)}
        onSuccess={handleCreateOrUpdate}
      />

      <DeleteScheduleModal
        schedule={deletingSchedule}
        open={!!deletingSchedule}
        onClose={() => setDeletingSchedule(null)}
        onSuccess={handleDelete}
      />
    </>
  );
}
