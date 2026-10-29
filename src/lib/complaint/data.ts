import { createClient } from "@/lib/supabase/server";
import { mapComplaintRow } from "@/lib/complaint/format";
import type { Complaint } from "@/types/complaint";

export async function getComplaints(includeArchived = false): Promise<Complaint[]> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from("complaints")
      .select("*")
      .order("filed_at", { ascending: false });
    if (!includeArchived) query = query.is("archived_at", null);
    const { data, error } = await query;

    if (error || !data?.length) return [];
    return data
      .map(mapComplaintRow)
      .sort((a, b) => Number(Boolean(a.archivedAt)) - Number(Boolean(b.archivedAt)));
  } catch {
    return [];
  }
}
