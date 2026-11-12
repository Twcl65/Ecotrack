-- Driver-submitted segregated garbage entries and collection history.

CREATE TABLE IF NOT EXISTS driver_garbage_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES collection_schedules(id) ON DELETE SET NULL,
  schedule_date DATE NOT NULL,
  barangay TEXT NOT NULL,
  driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  materials JSONB NOT NULL CHECK (jsonb_typeof(materials) = 'array'),
  total_price NUMERIC(12, 2) NOT NULL CHECK (total_price >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS driver_garbage_collections_driver_date_idx
  ON driver_garbage_collections (driver_id, schedule_date DESC, created_at DESC);

-- Older installs may already contain duplicate dates. Keep that history intact
-- and enforce one new record per driver/date with a claim table.
DROP INDEX IF EXISTS driver_garbage_collections_driver_schedule_date_uidx;

CREATE TABLE IF NOT EXISTS driver_garbage_collection_dates (
  driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  schedule_date DATE NOT NULL,
  PRIMARY KEY (driver_id, schedule_date)
);

INSERT INTO driver_garbage_collection_dates (driver_id, schedule_date)
SELECT DISTINCT driver_id, schedule_date
FROM driver_garbage_collections
ON CONFLICT (driver_id, schedule_date) DO NOTHING;

ALTER TABLE driver_garbage_collection_dates ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON driver_garbage_collection_dates FROM anon, authenticated;

CREATE OR REPLACE FUNCTION prevent_duplicate_driver_garbage_collection()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF auth.uid() IS DISTINCT FROM NEW.driver_id THEN
    RAISE EXCEPTION 'Drivers can only save their own garbage collections.'
      USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.driver_garbage_collection_dates (driver_id, schedule_date)
  VALUES (NEW.driver_id, NEW.schedule_date)
  ON CONFLICT (driver_id, schedule_date) DO NOTHING;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'A garbage collection is already saved for this driver and date.'
      USING
        ERRCODE = '23505',
        CONSTRAINT = 'driver_garbage_collections_driver_schedule_date_uidx';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_duplicate_driver_garbage_collection
  ON driver_garbage_collections;

CREATE TRIGGER prevent_duplicate_driver_garbage_collection
  BEFORE INSERT ON driver_garbage_collections
  FOR EACH ROW
  EXECUTE FUNCTION prevent_duplicate_driver_garbage_collection();

ALTER TABLE driver_garbage_collections ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON driver_garbage_collections TO authenticated;

DROP POLICY IF EXISTS "Drivers read own garbage collections"
  ON driver_garbage_collections;
DROP POLICY IF EXISTS "Drivers insert own garbage collections"
  ON driver_garbage_collections;
DROP POLICY IF EXISTS "Admins read all garbage collections"
  ON driver_garbage_collections;

CREATE POLICY "Drivers read own garbage collections"
  ON driver_garbage_collections
  FOR SELECT TO authenticated
  USING (driver_id = auth.uid());

CREATE POLICY "Drivers insert own garbage collections"
  ON driver_garbage_collections
  FOR INSERT TO authenticated
  WITH CHECK (driver_id = auth.uid());

CREATE POLICY "Admins read all garbage collections"
  ON driver_garbage_collections
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.system_users
      WHERE system_users.id = auth.uid()
        AND system_users.role = 'admin'
    )
  );

CREATE TABLE IF NOT EXISTS driver_garbage_material_prices (
  driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  material_key TEXT NOT NULL,
  material_name TEXT NOT NULL,
  unit TEXT NOT NULL CHECK (unit IN ('kg', 'piece')),
  default_rate NUMERIC(12, 2) NOT NULL CHECK (default_rate >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (driver_id, material_key)
);

ALTER TABLE driver_garbage_material_prices ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON driver_garbage_material_prices TO authenticated;

DROP POLICY IF EXISTS "Drivers manage own garbage material prices"
  ON driver_garbage_material_prices;

CREATE POLICY "Drivers manage own garbage material prices"
  ON driver_garbage_material_prices
  FOR ALL TO authenticated
  USING (driver_id = auth.uid())
  WITH CHECK (driver_id = auth.uid());

CREATE TABLE IF NOT EXISTS driver_garbage_materials (
  driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  material_key TEXT NOT NULL,
  material_name TEXT NOT NULL,
  unit TEXT NOT NULL CHECK (unit IN ('kg', 'piece')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (driver_id, material_key)
);

ALTER TABLE driver_garbage_materials ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, DELETE ON driver_garbage_materials TO authenticated;

DROP POLICY IF EXISTS "Drivers manage own garbage materials"
  ON driver_garbage_materials;

CREATE POLICY "Drivers manage own garbage materials"
  ON driver_garbage_materials
  FOR ALL TO authenticated
  USING (driver_id = auth.uid())
  WITH CHECK (driver_id = auth.uid());
