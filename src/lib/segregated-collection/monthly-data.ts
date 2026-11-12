"use server";

import { createClient } from "@/lib/supabase/server";

export type MonthlyCollectionReport = {
  reportYear: number;
  monthNumber: number;
  dayNumber: number;
  totalKg: number;
};

async function getAdminClient() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("You must be signed in to manage collection reports.");
  }

  const { data: currentUser, error: roleError } = await supabase
    .from("system_users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (roleError) {
    throw new Error(`Could not verify report access: ${roleError.message}`);
  }
  if (currentUser?.role !== "admin") {
    throw new Error("Only administrators can manage collection reports.");
  }

  return { supabase, user };
}

export async function getMonthlyCollectionReports(
  reportYear: number
): Promise<MonthlyCollectionReport[]> {
  if (!Number.isInteger(reportYear) || reportYear < 2000 || reportYear > 9999) {
    throw new Error("Choose a valid report year.");
  }

  return getCollectionReports(reportYear);
}

export async function getAllMonthlyCollectionReports(): Promise<
  MonthlyCollectionReport[]
> {
  return getCollectionReports();
}

async function getCollectionReports(
  reportYear?: number
): Promise<MonthlyCollectionReport[]> {
  const { supabase } = await getAdminClient();
  let query = supabase
    .from("monthly_collection_reports")
    .select("report_year, month_number, day_number, total_kg")
    .order("report_year", { ascending: true })
    .order("month_number", { ascending: true })
    .order("day_number", { ascending: true });
  if (reportYear !== undefined) query = query.eq("report_year", reportYear);
  const { data, error } = await query;

  if (error) {
    throw new Error(`Could not load monthly collection reports: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    reportYear: row.report_year,
    monthNumber: row.month_number,
    dayNumber: row.day_number,
    totalKg: Number(row.total_kg),
  }));
}

export async function saveMonthlyCollectionReport(input: {
  reportYear: number;
  monthNumber: number;
  dayNumber: number;
  totalKg: number;
}): Promise<MonthlyCollectionReport> {
  if (
    !Number.isInteger(input.reportYear) ||
    input.reportYear < 2000 ||
    input.reportYear > 9999 ||
    !Number.isInteger(input.monthNumber) ||
    input.monthNumber < 1 ||
    input.monthNumber > 12 ||
    !Number.isInteger(input.dayNumber) ||
    input.dayNumber < 1 ||
    input.dayNumber > new Date(Date.UTC(input.reportYear, input.monthNumber, 0)).getUTCDate() ||
    !Number.isFinite(input.totalKg) ||
    input.totalKg < 0 ||
    Math.abs(input.totalKg * 100 - Math.round(input.totalKg * 100)) > 1e-8
  ) {
    throw new Error("Enter a valid year, month, and collected amount.");
  }

  const { supabase, user } = await getAdminClient();
  const { data, error } = await supabase
    .from("monthly_collection_reports")
    .upsert(
      {
        report_year: input.reportYear,
        month_number: input.monthNumber,
        day_number: input.dayNumber,
        total_kg: input.totalKg,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "report_year,month_number,day_number" }
    )
    .select("report_year, month_number, day_number, total_kg")
    .single();

  if (error) {
    throw new Error(`Could not save monthly collection report: ${error.message}`);
  }

  return {
    reportYear: data.report_year,
    monthNumber: data.month_number,
    dayNumber: data.day_number,
    totalKg: Number(data.total_kg),
  };
}
