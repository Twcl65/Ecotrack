"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Barangay, BarangayFormValues, BarangayStatus } from "@/types/barangay";

type ActionResult =
  | { success: true; barangay?: Barangay }
  | { success: false; error: string };

function mapRow(row: {
  id: string;
  name: string;
  population: number;
  status: string;
  archived_at?: string | null;
  created_at: string;
  updated_at: string;
}): Barangay {
  return {
    id: row.id,
    name: row.name,
    population: row.population,
    status: row.status as BarangayStatus,
    archivedAt: row.archived_at ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function validateForm(values: BarangayFormValues): string | null {
  if (!values.name.trim()) return "Barangay name is required.";
  const pop = parseInt(values.population, 10);
  if (Number.isNaN(pop) || pop < 0) return "Population must be a valid number.";
  if (!values.status) return "Status is required.";
  return null;
}

function toRow(values: BarangayFormValues) {
  return {
    name: values.name.trim(),
    population: parseInt(values.population, 10),
    status: values.status,
  };
}

export async function createBarangay(
  values: BarangayFormValues
): Promise<ActionResult> {
  const err = validateForm(values);
  if (err) return { success: false, error: err };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("barangays")
    .insert(toRow(values))
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/barangay");
  revalidatePath("/dashboard");
  return { success: true, barangay: mapRow(data) };
}

export async function updateBarangay(
  id: string,
  values: BarangayFormValues
): Promise<ActionResult> {
  const err = validateForm(values);
  if (err) return { success: false, error: err };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("barangays")
    .update({ ...toRow(values), updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/barangay");
  revalidatePath("/dashboard");
  return { success: true, barangay: mapRow(data) };
}

export async function archiveBarangay(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("barangays")
    .update({
      archived_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .is("archived_at", null);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/barangay");
  revalidatePath("/dashboard");
  return { success: true };
}
