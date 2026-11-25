CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_code TEXT NOT NULL UNIQUE,
  plate_number TEXT NOT NULL,
  vehicle_type TEXT NOT NULL CHECK (
    vehicle_type IN ('Small Truck', 'Large Truck', 'Other')
  ),
  model TEXT NOT NULL,
  assigned_driver TEXT,
  starting_odometer_km NUMERIC(10, 1) NOT NULL DEFAULT 0
    CHECK (starting_odometer_km >= 0),
  current_odometer_km NUMERIC(10, 1) NOT NULL DEFAULT 0
    CHECK (current_odometer_km >= starting_odometer_km),
  last_maintenance_date DATE,
  last_maintenance_odometer_km NUMERIC(10, 1),
  next_maintenance_date DATE,
  next_maintenance_odometer_km NUMERIC(10, 1),
  maintenance_type TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS last_maintenance_odometer_km NUMERIC(10, 1),
  ADD COLUMN IF NOT EXISTS next_maintenance_odometer_km NUMERIC(10, 1);

CREATE UNIQUE INDEX IF NOT EXISTS vehicles_plate_number_upper_idx
  ON public.vehicles (UPPER(plate_number));

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.vehicles TO authenticated;

DROP POLICY IF EXISTS "Admins manage vehicles" ON public.vehicles;
CREATE POLICY "Admins manage vehicles"
  ON public.vehicles
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.system_users
      WHERE system_users.id = auth.uid()
        AND system_users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.system_users
      WHERE system_users.id = auth.uid()
        AND system_users.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Drivers read assigned vehicles" ON public.vehicles;
CREATE POLICY "Drivers read assigned vehicles"
  ON public.vehicles
  FOR SELECT TO authenticated
  USING (
    status = 'active'
    AND EXISTS (
      SELECT 1
      FROM public.system_users
      WHERE system_users.id = auth.uid()
        AND system_users.role = 'driver'
        AND system_users.status = 'active'
        AND system_users.archived_at IS NULL
        AND lower(regexp_replace(
          btrim(concat_ws(
            ' ',
            system_users.first_name,
            system_users.middle_name,
            system_users.last_name
          )),
          '\s+',
          ' ',
          'g'
        )) = lower(regexp_replace(btrim(vehicles.assigned_driver), '\s+', ' ', 'g'))
    )
  );
