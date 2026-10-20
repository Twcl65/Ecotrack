-- Live GPS positions for drivers during active collection schedules

CREATE TABLE IF NOT EXISTS driver_locations (
  schedule_id UUID PRIMARY KEY REFERENCES collection_schedules(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  driver_name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  accuracy DOUBLE PRECISION,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_tracking BOOLEAN NOT NULL DEFAULT TRUE
);

ALTER TABLE driver_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read active driver locations" ON driver_locations;
DROP POLICY IF EXISTS "Assigned drivers publish locations" ON driver_locations;
DROP POLICY IF EXISTS "Assigned drivers update locations" ON driver_locations;

CREATE POLICY "Read active driver locations" ON driver_locations
  FOR SELECT TO authenticated
  USING (
    driver_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM collection_schedules s
      WHERE s.id = schedule_id
        AND s.status = 'ongoing'
        AND is_tracking = TRUE
    )
  );

CREATE POLICY "Assigned drivers publish locations" ON driver_locations
  FOR INSERT TO authenticated
  WITH CHECK (
    driver_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM collection_schedules s
      JOIN system_users u ON u.id = auth.uid()
      WHERE s.id = schedule_id
        AND s.status = 'ongoing'
        AND s.driver = concat_ws(' ', u.first_name, nullif(u.middle_name, ''), u.last_name)
        AND u.role = 'driver'
    )
  );

CREATE POLICY "Assigned drivers update locations" ON driver_locations
  FOR UPDATE TO authenticated
  USING (
    driver_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM collection_schedules s
      JOIN system_users u ON u.id = auth.uid()
      WHERE s.id = schedule_id
        AND s.driver = concat_ws(' ', u.first_name, nullif(u.middle_name, ''), u.last_name)
        AND u.role = 'driver'
    )
  )
  WITH CHECK (
    driver_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM collection_schedules s
      JOIN system_users u ON u.id = auth.uid()
      WHERE s.id = schedule_id
        AND s.driver = concat_ws(' ', u.first_name, nullif(u.middle_name, ''), u.last_name)
        AND u.role = 'driver'
    )
  );

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
    AND NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'driver_locations'
    )
  THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_locations;
  END IF;
END $$;
