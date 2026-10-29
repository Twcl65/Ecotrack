import { createClient } from "@/lib/supabase/server";
import type { Barangay, BarangayStatus } from "@/types/barangay";

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

export async function getBarangays(includeArchived = false): Promise<Barangay[]> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from("barangays")
      .select("*")
      .order("created_at", { ascending: false });
    if (!includeArchived) query = query.is("archived_at", null);
    const { data, error } = await query;

    if (error || !data?.length) return [];
    return data
      .map(mapRow)
      .sort((a, b) => Number(Boolean(a.archivedAt)) - Number(Boolean(b.archivedAt)));
  } catch {
    return [];
  }
}
