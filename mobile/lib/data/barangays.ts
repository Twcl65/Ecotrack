import { supabase } from "../supabase";

export async function fetchBarangayNames(): Promise<string[]> {
  const { data, error } = await supabase
    .from("barangays")
    .select("name")
    .eq("status", "active")
    .order("name");

  if (error || !data) {
    return [
      "Upper Jasaan",
      "Lower Jasaan",
      "Nahalinan",
      "Solana",
      "Aplaya",
      "Bubontogan",
      "San Antonio",
    ];
  }

  return data.map((row) => row.name);
}
