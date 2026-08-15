import { createClient } from "@/lib/supabase/server";
import type { GeneratedReport, ReportType } from "@/types/reports";

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
  const generatedAt = row.generated_at;
  const d = new Date(generatedAt);
  return {
    id: row.id,
    reportName: row.report_name,
    reportType: row.report_type as ReportType,
    periodLabel: row.period_label,
    generatedBy: row.generated_by,
    generatedAt,
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

export async function getGeneratedReports(): Promise<GeneratedReport[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("generated_reports")
      .select("*")
      .order("generated_at", { ascending: false });

    if (error || !data?.length) return [];
    return data.map(mapReportRow);
  } catch {
    return [];
  }
}

export async function getWasteKgBaseline(): Promise<number> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("dashboard_kpis").select("waste_collected_kg").single();
    return data?.waste_collected_kg ? Number(data.waste_collected_kg) : 30670;
  } catch {
    return 30670;
  }
}
