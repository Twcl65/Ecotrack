"use client";

import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { generateReports } from "@/app/dashboard/report/actions";
import {
  computeReportAnalytics,
} from "@/lib/reports/aggregate";
import type { Complaint } from "@/types/complaint";
import type { GeneratedReport, ReportFilters } from "@/types/reports";
import type { Schedule } from "@/types/schedules";
import RecentReportsTable from "./RecentReportsTable";
import ReportBarangayChart from "./ReportBarangayChart";
import ReportCollectionsChart from "./ReportCollectionsChart";
import ReportKpiCards from "./ReportKpiCards";
import ReportStatusChart from "./ReportStatusChart";
import ReportTypeSelect from "./ReportTypeSelect";

type Props = {
  schedules: Schedule[];
  complaints: Complaint[];
  barangayOptions: string[];
  initialReports: GeneratedReport[];
  initialFilters: ReportFilters;
  wasteKgBaseline: number;
  generatedBy: string;
};

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white py-2 px-3 text-sm outline-none focus:border-eco-primary focus:ring-2 focus:ring-eco-primary/20";

export default function ReportPageContent({
  schedules,
  complaints,
  barangayOptions,
  initialReports,
  initialFilters,
  wasteKgBaseline,
  generatedBy,
}: Props) {
  const [filters, setFilters] = useState<ReportFilters>(initialFilters);
  const [reports, setReports] = useState(initialReports);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analytics = useMemo(
    () =>
      computeReportAnalytics(
        schedules,
        complaints,
        filters,
        wasteKgBaseline
      ),
    [schedules, complaints, filters, wasteKgBaseline]
  );

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    const result = await generateReports(filters, generatedBy);
    setGenerating(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setReports((prev) => [...result.reports, ...prev]);
  }

  return (
    <div className="reports-page space-y-3">
      <div className="dashboard-card p-3">
        <div className="flex flex-wrap items-end gap-3">
          <FilterField label="From Date" className="w-full sm:w-[150px]">
            <input
              type="date"
              value={filters.fromDate}
              onChange={(e) =>
                setFilters((f) => ({ ...f, fromDate: e.target.value }))
              }
              className={inputClass}
            />
          </FilterField>

          <FilterField label="To Date" className="w-full sm:w-[150px]">
            <input
              type="date"
              value={filters.toDate}
              onChange={(e) =>
                setFilters((f) => ({ ...f, toDate: e.target.value }))
              }
              className={inputClass}
            />
          </FilterField>

          <ReportTypeSelect
            value={filters.reportType}
            onChange={(reportType) =>
              setFilters((f) => ({ ...f, reportType }))
            }
          />

          <FilterField label="Barangay" className="w-full sm:w-[150px]">
            <div className="relative">
              <select
                value={filters.barangay}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, barangay: e.target.value }))
                }
                className={`${inputClass} appearance-none pr-8`}
              >
                <option value="all">All Barangay</option>
                {barangayOptions.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </FilterField>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-eco-primary px-4 py-2 text-sm font-semibold text-white hover:bg-eco-dark disabled:opacity-60"
          >
            {generating ? "Generating..." : "Generate Reports"}
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>

      <ReportKpiCards kpis={analytics.kpis} />

      <div className="reports-charts-row">
        <ReportCollectionsChart data={analytics.collectionsOverTime} />
        <ReportBarangayChart data={analytics.topBarangays} />
        <ReportStatusChart data={analytics.statusBreakdown} />
      </div>

      <RecentReportsTable
        reports={reports}
        analytics={analytics}
        reportTypeFilter={filters.reportType}
      />
    </div>
  );
}

function FilterField({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-xs font-medium text-gray-600">
        {label}
      </label>
      {children}
    </div>
  );
}
