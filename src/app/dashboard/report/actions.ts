"use server";

import { revalidatePath } from "next/cache";
import { buildPeriodLabel } from "@/lib/reports/aggregate";
import { createClient } from "@/lib/supabase/server";
import type { GeneratedReport, ReportFilters, ReportType } from "@/types/reports";
import { REPORT_TYPE_META } from "@/types/reports";

type ActionResult =
  | { success: true; reports: GeneratedReport[] }
  | { success: false; error: string };

function mapReportRow(row: {
  id: string;
  report_name: string;
  report_type: string;
  period_label: string;
  generated_by: string;
  generated_at: string;
  from_date: string;
  to_date: string;
  barangay_filter: string | null;
}): GeneratedReport {
  const d = new Date(row.generated_at);
  return {
    id: row.id,
    reportName: row.report_name,
    reportType: row.report_type as ReportType,
    periodLabel: row.period_label,
    generatedBy: row.generated_by,
    generatedAt: row.generated_at,
    dateLabel: d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    timeLabel: d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),
    fromDate: row.from_date,
    toDate: row.to_date,
    barangayFilter: row.barangay_filter,
  };
}

const GENERATABLE_TYPES: Exclude<ReportType, "all">[] = [
  "collection",
  "barangay",
  "complaint",
  "driver",
  "route",
  "user",
];

export async function generateReports(
  filters: ReportFilters,
  generatedBy: string
): Promise<ActionResult> {
  const typesToGenerate: Exclude<ReportType, "all">[] =
    filters.reportType === "all"
      ? GENERATABLE_TYPES
      : [filters.reportType as Exclude<ReportType, "all">];

  const periodLabel = buildPeriodLabel(filters.fromDate, filters.toDate);
  const supabase = await createClient();
  const now = Date.now();
  const rows = typesToGenerate.map((type, index) => ({
    report_name: REPORT_TYPE_META[type].name,
    report_type: type,
    period_label: periodLabel,
    generated_by: generatedBy,
    generated_at: new Date(now - index * 15 * 60 * 1000).toISOString(),
    from_date: filters.fromDate,
    to_date: filters.toDate,
    barangay_filter: filters.barangay === "all" ? null : filters.barangay,
  }));

  const { data, error } = await supabase
    .from("generated_reports")
    .insert(rows)
    .select();

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/report");
  return {
    success: true,
    reports: (data ?? []).map(mapReportRow),
  };
}
