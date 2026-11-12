import { supabase } from "../supabase";

export type GarbageMaterialUnit = "kg" | "piece";

export type GarbageMaterialDefinition = {
  materialKey: string;
  materialName: string;
  unit: GarbageMaterialUnit;
};

export type GarbageMaterialPriceDefault = {
  materialKey: string;
  materialName: string;
  unit: GarbageMaterialUnit;
  rate: number;
};

function normalizeMaterialKey(name: string, unit: GarbageMaterialUnit) {
  return `${name.trim().toLowerCase()}|${unit}`;
}

export async function fetchGarbageMaterials(
  driverId: string
): Promise<GarbageMaterialDefinition[]> {
  const { data, error } = await supabase
    .from("driver_garbage_materials")
    .select("material_key, material_name, unit")
    .eq("driver_id", driverId)
    .order("material_name", { ascending: true });

  if (error) {
    throw new Error(`Could not load saved materials: ${error.message}`);
  }
  return (data ?? []).map((row) => ({
    materialKey: row.material_key,
    materialName: row.material_name,
    unit: row.unit as GarbageMaterialUnit,
  }));
}

export async function saveGarbageMaterial(
  driverId: string,
  materialName: string,
  unit: GarbageMaterialUnit
): Promise<GarbageMaterialDefinition> {
  const materialKey = normalizeMaterialKey(materialName, unit);
  const { data, error } = await supabase
    .from("driver_garbage_materials")
    .insert({
      driver_id: driverId,
      material_key: materialKey,
      material_name: materialName.trim(),
      unit,
    })
    .select("material_key, material_name, unit")
    .single();

  if (error) {
    const message =
      error.code === "23505"
        ? "This material is already saved."
        : `Could not save material: ${error.message}`;
    throw new Error(message);
  }
  if (!data) {
    throw new Error("Material was not saved. Please try again.");
  }
  return {
    materialKey: data.material_key,
    materialName: data.material_name,
    unit: data.unit as GarbageMaterialUnit,
  };
}

export async function deleteGarbageMaterial(
  driverId: string,
  materialKey: string
): Promise<void> {
  const { error } = await supabase
    .from("driver_garbage_materials")
    .delete()
    .eq("driver_id", driverId)
    .eq("material_key", materialKey);

  if (error) {
    throw new Error(`Could not remove saved material: ${error.message}`);
  }
}

export async function fetchGarbageMaterialPriceDefaults(
  driverId: string
): Promise<GarbageMaterialPriceDefault[]> {
  const { data, error } = await supabase
    .from("driver_garbage_material_prices")
    .select("material_key, material_name, unit, default_rate")
    .eq("driver_id", driverId)
    .order("material_name", { ascending: true });

  if (error) {
    throw new Error(`Could not load default material prices: ${error.message}`);
  }
  return (data ?? []).map((row) => ({
    materialKey: row.material_key,
    materialName: row.material_name,
    unit: row.unit as GarbageMaterialUnit,
    rate: Number(row.default_rate),
  }));
}

export async function saveGarbageMaterialPriceDefault(
  driverId: string,
  materialName: string,
  unit: GarbageMaterialUnit,
  rate: number
): Promise<GarbageMaterialPriceDefault> {
  const { data, error } = await supabase
    .from("driver_garbage_material_prices")
    .upsert(
      {
        driver_id: driverId,
        material_key: normalizeMaterialKey(materialName, unit),
        material_name: materialName.trim(),
        unit,
        default_rate: rate,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "driver_id,material_key" }
    )
    .select("material_key, material_name, unit, default_rate")
    .single();

  if (error) {
    throw new Error(`Could not save default material price: ${error.message}`);
  }
  if (!data) {
    throw new Error("Default material price was not saved. Please try again.");
  }
  return {
    materialKey: data.material_key,
    materialName: data.material_name,
    unit: data.unit as GarbageMaterialUnit,
    rate: Number(data.default_rate),
  };
}

export type GarbageMaterialEntry = {
  id: string;
  name: string;
  unit: GarbageMaterialUnit;
  rate: number;
  quantity: number;
  price: number;
};

export type GarbageCollectionRecord = {
  id: string;
  scheduleId: string;
  scheduleDate: string;
  barangay: string;
  driverId: string;
  materials: GarbageMaterialEntry[];
  totalPrice: number;
  createdAt: string;
};

type SaveGarbageCollectionParams = {
  scheduleId: string;
  scheduleDate: string;
  barangay: string;
  driverId: string;
  materials: GarbageMaterialEntry[];
  totalPrice: number;
};

export class GarbageCollectionSaveError extends Error {
  constructor(message: string, readonly code?: string) {
    super(message);
    this.name = "GarbageCollectionSaveError";
  }
}

function mapRecord(row: Record<string, unknown>): GarbageCollectionRecord {
  if (!Array.isArray(row.materials)) {
    throw new Error("A saved garbage collection record has invalid materials.");
  }

  return {
    id: String(row.id),
    scheduleId: String(row.schedule_id),
    scheduleDate: String(row.schedule_date),
    barangay: String(row.barangay),
    driverId: String(row.driver_id),
    materials: row.materials as GarbageMaterialEntry[],
    totalPrice: Number(row.total_price),
    createdAt: String(row.created_at),
  };
}

export async function saveGarbageCollection(
  params: SaveGarbageCollectionParams
): Promise<GarbageCollectionRecord> {
  const { data, error } = await supabase
    .from("driver_garbage_collections")
    .insert({
      schedule_id: params.scheduleId,
      schedule_date: params.scheduleDate,
      barangay: params.barangay,
      driver_id: params.driverId,
      materials: params.materials,
      total_price: params.totalPrice,
    })
    .select(
      "id, schedule_id, schedule_date, barangay, driver_id, materials, total_price, created_at"
    )
    .single();

  if (error) {
    throw new GarbageCollectionSaveError(
      `Could not save collected garbage: ${error.message}`,
      error.code
    );
  }
  if (!data) {
    throw new Error("Collected garbage was not saved. Please try again.");
  }
  return mapRecord(data);
}

export async function fetchGarbageCollections(
  driverId: string,
  fromDate?: string,
  toDate?: string
): Promise<GarbageCollectionRecord[]> {
  let query = supabase
    .from("driver_garbage_collections")
    .select(
      "id, schedule_id, schedule_date, barangay, driver_id, materials, total_price, created_at"
    )
    .eq("driver_id", driverId)
    .order("schedule_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (fromDate) query = query.gte("schedule_date", fromDate);
  if (toDate) query = query.lte("schedule_date", toDate);

  const { data, error } = await query;
  if (error) {
    throw new Error(`Could not load collected garbage history: ${error.message}`);
  }
  return (data ?? []).map(mapRecord);
}

export async function fetchSavedGarbageScheduleDates(
  driverId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from("driver_garbage_collections")
    .select("schedule_date")
    .eq("driver_id", driverId);

  if (error) {
    throw new Error(`Could not check saved collection dates: ${error.message}`);
  }
  return [...new Set((data ?? []).map((row) => row.schedule_date))];
}

export async function fetchGarbageCollection(
  recordId: string,
  driverId: string
): Promise<GarbageCollectionRecord> {
  const { data, error } = await supabase
    .from("driver_garbage_collections")
    .select(
      "id, schedule_id, schedule_date, barangay, driver_id, materials, total_price, created_at"
    )
    .eq("id", recordId)
    .eq("driver_id", driverId)
    .single();

  if (error) {
    throw new Error(`Could not load collected garbage details: ${error.message}`);
  }
  if (!data) {
    throw new Error("This collected garbage record could not be found.");
  }
  return mapRecord(data);
}
