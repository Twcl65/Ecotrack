"use client";

import { ChevronDown, FileText } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ReportType } from "@/types/reports";
import { REPORT_TYPE_OPTIONS } from "@/types/reports";

type Props = {
  value: ReportType;
  onChange: (value: ReportType) => void;
};

export default function ReportTypeSelect({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected =
    REPORT_TYPE_OPTIONS.find((o) => o.value === value) ?? REPORT_TYPE_OPTIONS[0];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={rootRef} className="relative min-w-[180px] flex-1 sm:max-w-[240px]">
      <label className="mb-1.5 block text-xs font-medium text-gray-600">
        Report Type
      </label>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none hover:border-gray-300 focus:border-eco-primary focus:ring-2 focus:ring-eco-primary/20"
      >
        <span className="truncate text-gray-800">{selected.label}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 max-h-80 w-full min-w-[280px] overflow-auto rounded-xl border border-gray-200 bg-white py-2 shadow-lg">
          <div className="flex items-center gap-2 border-b border-gray-100 px-3 pb-2">
            <FileText className="h-4 w-4 text-blue-700" />
            <span className="text-sm font-bold text-blue-900">Report Types</span>
          </div>
          {REPORT_TYPE_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-start gap-3 px-3 py-2.5 text-left hover:bg-gray-50 ${
                  value === option.value ? "bg-eco-light/40" : ""
                }`}
              >
                <span
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${option.iconBg}`}
                >
                  <Icon className={`h-4 w-4 ${option.iconColor}`} />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-gray-900">
                    {option.label}
                  </span>
                  <span className="block text-xs text-gray-500">
                    {option.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
