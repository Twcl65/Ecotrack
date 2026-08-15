"use client";

import type { LucideIcon } from "lucide-react";

type Props = {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
};

export default function SettingsFieldRow({ icon: Icon, label, children }: Props) {
  return (
    <div className="flex gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-eco-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
        {children}
      </div>
    </div>
  );
}

export const settingsInputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-eco-primary focus:ring-2 focus:ring-eco-primary/20";

export const settingsSelectClass = settingsInputClass;
