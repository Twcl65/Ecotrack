import { createClient } from "@/lib/supabase/server";
import { mapComplaintRow } from "@/lib/complaint/format";
import type { Complaint } from "@/types/complaint";

export async function getComplaints(): Promise<Complaint[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("complaints")
      .select("*")
      .order("filed_at", { ascending: false });

    if (error || !data?.length) return [];
    return data.map(mapComplaintRow);
  } catch {
    return [];
  }
}
