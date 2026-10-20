import { createClient } from "@/lib/supabase/server";
import type { Barangay, BarangayStatus } from "@/types/barangay";

function mapRow(row: {
  id: string;
  name: string;
  population: number;
  status: string;
  created_at: string;
  updated_at: string;
}): Barangay {
  return {
    id: row.id,
    name: row.name,
    population: row.population,
    status: row.status as BarangayStatus,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function getBarangays(): Promise<Barangay[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("barangays")
      .select("*")
      .order("name", { ascending: true });

    if (error || !data?.length) return [];
    return data.map(mapRow);
  } catch {
    return [];
  }
}
