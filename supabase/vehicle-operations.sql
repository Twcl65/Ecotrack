-- Run after vehicles.sql, schedules.sql, and push-notifications.sql.

ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS last_maintenance_odometer_km NUMERIC(10, 1),
  ADD COLUMN IF NOT EXISTS next_maintenance_odometer_km NUMERIC(10, 1);

ALTER TABLE public.collection_schedules
  ADD COLUMN IF NOT EXISTS vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS actual_distance_km NUMERIC(10, 3) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS odometer_start_km NUMERIC(10, 1),
  ADD COLUMN IF NOT EXISTS odometer_end_km NUMERIC(10, 1),
  ADD COLUMN IF NOT EXISTS odometer_applied_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_gps_latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS last_gps_longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS last_gps_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS collection_schedules_vehicle_id_idx
  ON public.collection_schedules (vehicle_id, collection_date DESC);

CREATE TABLE IF NOT EXISTS public.vehicle_maintenance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  driver_name TEXT NOT NULL,
  request_type TEXT NOT NULL CHECK (
    request_type IN (
      'Routine maintenance',
      'Repair',
      'Oil Change',
      'Safety issue',
      'Other'
    )
  ),
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'approved', 'in_progress', 'completed', 'rejected')
  ),
  admin_note TEXT,
  scheduled_maintenance_date DATE,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.vehicle_maintenance_requests
  ADD COLUMN IF NOT EXISTS scheduled_maintenance_date DATE;

ALTER TABLE public.vehicle_maintenance_requests
  DROP CONSTRAINT IF EXISTS vehicle_maintenance_requests_request_type_check;
ALTER TABLE public.vehicle_maintenance_requests
  ADD CONSTRAINT vehicle_maintenance_requests_request_type_check
  CHECK (
    request_type IN (
      'Routine maintenance',
      'Repair',
      'Oil Change',
      'Safety issue',
      'Other'
    )
  );

CREATE INDEX IF NOT EXISTS vehicle_maintenance_requests_status_date_idx
  ON public.vehicle_maintenance_requests (status, requested_at DESC);
CREATE INDEX IF NOT EXISTS vehicle_maintenance_requests_driver_date_idx
  ON public.vehicle_maintenance_requests (driver_id, requested_at DESC);

DO $$
BEGIN
  IF to_regprocedure('public.enqueue_push_event(text,uuid,text,text,jsonb)') IS NULL THEN
    RAISE EXCEPTION
      'Run supabase/push-notifications.sql before supabase/vehicle-operations.sql.';
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'vehicle_maintenance_requests'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicle_maintenance_requests';
  END IF;
END;
$$;

ALTER TABLE public.vehicle_maintenance_requests ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.vehicle_maintenance_requests TO authenticated;

DROP POLICY IF EXISTS "Admins manage vehicle maintenance requests"
  ON public.vehicle_maintenance_requests;
CREATE POLICY "Admins manage vehicle maintenance requests"
  ON public.vehicle_maintenance_requests
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

DROP POLICY IF EXISTS "Drivers read own vehicle maintenance requests"
  ON public.vehicle_maintenance_requests;
CREATE POLICY "Drivers read own vehicle maintenance requests"
  ON public.vehicle_maintenance_requests
  FOR SELECT TO authenticated
  USING (driver_id = auth.uid());

DROP POLICY IF EXISTS "Drivers request maintenance for assigned vehicles"
  ON public.vehicle_maintenance_requests;
CREATE POLICY "Drivers request maintenance for assigned vehicles"
  ON public.vehicle_maintenance_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    driver_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.system_users
      WHERE system_users.id = auth.uid()
        AND system_users.role = 'driver'
        AND system_users.status = 'active'
        AND system_users.archived_at IS NULL
    )
    AND EXISTS (
      SELECT 1 FROM public.vehicles
      JOIN public.system_users
        ON system_users.id = auth.uid()
      WHERE vehicles.id = vehicle_maintenance_requests.vehicle_id
        AND vehicles.status = 'active'
        AND lower(regexp_replace(
          btrim(vehicles.assigned_driver),
          '\s+',
          ' ',
          'g'
        )) = lower(regexp_replace(
          btrim(concat_ws(
            ' ',
            system_users.first_name,
            system_users.middle_name,
            system_users.last_name
          )),
          '\s+',
          ' ',
          'g'
        ))
    )
  );

CREATE OR REPLACE FUNCTION public.set_vehicle_maintenance_request_driver()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_driver_name TEXT;
BEGIN
  SELECT btrim(concat_ws(
    ' ',
    su.first_name,
    su.middle_name,
    su.last_name
  ))
  INTO v_driver_name
  FROM public.system_users AS su
  WHERE su.id = auth.uid()
    AND su.role = 'driver'
    AND su.status = 'active'
    AND su.archived_at IS NULL;

  IF v_driver_name IS NULL THEN
    RAISE EXCEPTION 'Only active drivers can request vehicle maintenance.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.vehicles AS v
    WHERE v.id = NEW.vehicle_id
      AND v.status = 'active'
      AND lower(regexp_replace(btrim(v.assigned_driver), '\s+', ' ', 'g'))
        = lower(regexp_replace(v_driver_name, '\s+', ' ', 'g'))
  ) THEN
    RAISE EXCEPTION 'You can only request maintenance for your assigned vehicle.';
  END IF;

  NEW.driver_id := auth.uid();
  NEW.driver_name := v_driver_name;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS vehicle_maintenance_request_driver
  ON public.vehicle_maintenance_requests;
CREATE TRIGGER vehicle_maintenance_request_driver
  BEFORE INSERT ON public.vehicle_maintenance_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.set_vehicle_maintenance_request_driver();

CREATE OR REPLACE FUNCTION public.notify_vehicle_maintenance_request()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_vehicle_code TEXT;
BEGIN
  SELECT vehicle_code
  INTO v_vehicle_code
  FROM public.vehicles
  WHERE id = NEW.vehicle_id;

  PERFORM public.enqueue_push_event(
    'administrator',
    NULL,
    'Vehicle maintenance requested',
    format('%s requested %s for %s.', NEW.driver_name, NEW.request_type, COALESCE(v_vehicle_code, 'a vehicle')),
    jsonb_build_object(
      'kind', 'vehicle_maintenance_request',
      'id', NEW.id,
      'vehicleId', NEW.vehicle_id
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS vehicle_maintenance_request_push
  ON public.vehicle_maintenance_requests;
CREATE TRIGGER vehicle_maintenance_request_push
  AFTER INSERT ON public.vehicle_maintenance_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_vehicle_maintenance_request();

CREATE OR REPLACE FUNCTION public.notify_vehicle_maintenance_status()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_vehicle_code TEXT;
  v_status_label TEXT;
BEGIN
  IF (
    NEW.status IS DISTINCT FROM OLD.status
    AND NEW.status IN ('approved', 'rejected', 'in_progress', 'completed')
  ) OR (
    NEW.status = 'approved'
    AND OLD.status = 'approved'
    AND NEW.scheduled_maintenance_date IS DISTINCT FROM OLD.scheduled_maintenance_date
  ) THEN
    SELECT vehicle_code
    INTO v_vehicle_code
    FROM public.vehicles
    WHERE id = NEW.vehicle_id;

    v_status_label := CASE
      WHEN NEW.status = 'approved' AND OLD.status = 'approved'
        THEN 'rescheduled'
      ELSE replace(NEW.status, '_', ' ')
    END;
    PERFORM public.enqueue_push_event(
      NULL,
      NEW.driver_id,
      format('Maintenance request %s', v_status_label),
      format(
        'Your %s request for %s was %s.%s%s',
        NEW.request_type,
        COALESCE(v_vehicle_code, 'your vehicle'),
        v_status_label,
        CASE
          WHEN NULLIF(btrim(NEW.admin_note), '') IS NULL THEN ''
          ELSE format(' Admin note: %s', btrim(NEW.admin_note))
        END,
        CASE
          WHEN NEW.status = 'approved'
            AND NEW.scheduled_maintenance_date IS NOT NULL
          THEN format(
            ' Scheduled maintenance date: %s.',
            to_char(NEW.scheduled_maintenance_date, 'Mon FMDD, YYYY')
          )
          ELSE ''
        END
      ),
      jsonb_build_object(
        'kind', 'vehicle_maintenance',
        'id', NEW.id,
        'status', NEW.status,
        'event', v_status_label,
        'scheduledMaintenanceDate', NEW.scheduled_maintenance_date
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS vehicle_maintenance_request_status_push
  ON public.vehicle_maintenance_requests;
CREATE TRIGGER vehicle_maintenance_request_status_push
  AFTER UPDATE OF status, scheduled_maintenance_date
  ON public.vehicle_maintenance_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_vehicle_maintenance_status();

CREATE OR REPLACE FUNCTION public.record_collection_gps_point(
  p_schedule_id UUID,
  p_latitude DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION,
  p_accuracy DOUBLE PRECISION,
  p_recorded_at TIMESTAMPTZ
)
RETURNS NUMERIC
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_driver TEXT;
  v_status TEXT;
  v_driver_name TEXT;
  v_previous_lat DOUBLE PRECISION;
  v_previous_lon DOUBLE PRECISION;
  v_previous_at TIMESTAMPTZ;
  v_distance_km DOUBLE PRECISION := 0;
  v_seconds DOUBLE PRECISION;
  v_a DOUBLE PRECISION;
BEGIN
  IF p_latitude IS NULL OR p_longitude IS NULL
     OR p_latitude NOT BETWEEN -90 AND 90
     OR p_longitude NOT BETWEEN -180 AND 180 THEN
    RAISE EXCEPTION 'Invalid GPS coordinates.';
  END IF;

  SELECT btrim(concat_ws(
    ' ',
    su.first_name,
    su.middle_name,
    su.last_name
  ))
  INTO v_driver_name
  FROM public.system_users AS su
  WHERE su.id = auth.uid()
    AND su.role = 'driver'
    AND su.status = 'active'
    AND su.archived_at IS NULL;

  IF v_driver_name IS NULL THEN
    RAISE EXCEPTION 'Only active drivers can record collection GPS distance.';
  END IF;

  SELECT s.driver, s.status, s.last_gps_latitude, s.last_gps_longitude, s.last_gps_at
  INTO v_driver, v_status, v_previous_lat, v_previous_lon, v_previous_at
  FROM public.collection_schedules AS s
  WHERE s.id = p_schedule_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Collection schedule not found.';
  END IF;
  IF v_status <> 'ongoing'
     OR lower(regexp_replace(btrim(v_driver), '\s+', ' ', 'g'))
       IS DISTINCT FROM lower(regexp_replace(v_driver_name, '\s+', ' ', 'g')) THEN
    RAISE EXCEPTION 'This collection is not assigned to the signed-in driver.';
  END IF;
  IF p_recorded_at IS NULL OR p_recorded_at > NOW() + INTERVAL '1 minute' THEN
    RAISE EXCEPTION 'Invalid GPS timestamp.';
  END IF;

  IF p_accuracy IS NULL OR p_accuracy < 0 OR p_accuracy > 50
     OR (v_previous_at IS NOT NULL AND p_recorded_at <= v_previous_at) THEN
    RETURN 0;
  END IF;

  IF v_previous_at IS NOT NULL
     AND v_previous_lat IS NOT NULL
     AND v_previous_lon IS NOT NULL THEN
    v_a :=
      power(sin(radians(p_latitude - v_previous_lat) / 2), 2)
      + cos(radians(v_previous_lat))
      * cos(radians(p_latitude))
      * power(sin(radians(p_longitude - v_previous_lon) / 2), 2);
    v_distance_km := 6371 * 2 * asin(sqrt(LEAST(1, GREATEST(0, v_a))));
    v_seconds := EXTRACT(EPOCH FROM p_recorded_at - v_previous_at);

    IF v_seconds <= 0
       OR v_distance_km < 0.003
       OR v_distance_km / (v_seconds / 3600.0) > 120 THEN
      v_distance_km := 0;
    END IF;
  END IF;

  UPDATE public.collection_schedules
  SET actual_distance_km = actual_distance_km + v_distance_km,
      last_gps_latitude = p_latitude,
      last_gps_longitude = p_longitude,
      last_gps_at = p_recorded_at,
      updated_at = NOW()
  WHERE id = p_schedule_id;

  RETURN v_distance_km::NUMERIC;
END;
$$;
REVOKE ALL ON FUNCTION public.record_collection_gps_point(
  UUID, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, TIMESTAMPTZ
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_collection_gps_point(
  UUID, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, TIMESTAMPTZ
) TO authenticated;

CREATE OR REPLACE FUNCTION public.prepare_collection_vehicle_odometer()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_vehicle_id UUID;
  v_odometer NUMERIC(10, 1);
BEGIN
  IF NEW.status = 'ongoing'
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'ongoing')
     AND NEW.odometer_applied_at IS NULL THEN
    NEW.actual_distance_km := 0;
    NEW.odometer_end_km := NULL;
    NEW.last_gps_latitude := NULL;
    NEW.last_gps_longitude := NULL;
    NEW.last_gps_at := NULL;
    NEW.vehicle_id := NULL;
    NEW.odometer_start_km := NULL;

    SELECT v.id, v.current_odometer_km
    INTO v_vehicle_id, v_odometer
    FROM public.routes AS r
    JOIN public.vehicles AS v
      ON upper(btrim(v.vehicle_code)) = upper(btrim(r.vehicle_id))
    WHERE r.id = NEW.route_id
      AND v.status = 'active'
      AND lower(regexp_replace(btrim(v.assigned_driver), '\s+', ' ', 'g'))
        = lower(regexp_replace(btrim(NEW.driver), '\s+', ' ', 'g'))
    ORDER BY v.created_at
    LIMIT 1;

    IF FOUND THEN
      NEW.vehicle_id := v_vehicle_id;
      NEW.odometer_start_km := v_odometer;
    END IF;
  END IF;

  IF NEW.status = 'completed'
     AND OLD.status = 'ongoing'
     AND OLD.odometer_applied_at IS NULL
     AND OLD.vehicle_id IS NOT NULL
     AND OLD.odometer_start_km IS NOT NULL
     AND OLD.actual_distance_km > 0 THEN
    NEW.vehicle_id := OLD.vehicle_id;
    NEW.odometer_start_km := OLD.odometer_start_km;
    NEW.odometer_end_km := round(
      OLD.odometer_start_km + OLD.actual_distance_km,
      1
    );
    NEW.odometer_applied_at := NOW();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS collection_vehicle_odometer_prepare
  ON public.collection_schedules;
CREATE TRIGGER collection_vehicle_odometer_prepare
  BEFORE INSERT OR UPDATE OF status ON public.collection_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.prepare_collection_vehicle_odometer();

CREATE OR REPLACE FUNCTION public.apply_collection_vehicle_odometer()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_new_odometer NUMERIC(10, 1);
BEGIN
  IF NEW.status = 'completed'
     AND OLD.status = 'ongoing'
     AND OLD.odometer_applied_at IS NULL
     AND NEW.odometer_applied_at IS NOT NULL
     AND NEW.vehicle_id IS NOT NULL
     AND NEW.odometer_end_km IS NOT NULL THEN
    UPDATE public.vehicles
     SET current_odometer_km = current_odometer_km + NEW.actual_distance_km,
        updated_at = NOW()
     WHERE id = NEW.vehicle_id
     RETURNING current_odometer_km INTO v_new_odometer;

     IF FOUND THEN
       UPDATE public.collection_schedules
       SET odometer_end_km = v_new_odometer
       WHERE id = NEW.id;
     END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS collection_vehicle_odometer_apply
  ON public.collection_schedules;
CREATE TRIGGER collection_vehicle_odometer_apply
  AFTER UPDATE OF status ON public.collection_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.apply_collection_vehicle_odometer();

CREATE OR REPLACE FUNCTION public.record_completed_vehicle_maintenance()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.status = 'approved'
     AND NEW.scheduled_maintenance_date IS NOT NULL
     AND (
       OLD.status IS DISTINCT FROM NEW.status
       OR OLD.scheduled_maintenance_date IS DISTINCT FROM NEW.scheduled_maintenance_date
     ) THEN
    UPDATE public.vehicles
    SET next_maintenance_date = NEW.scheduled_maintenance_date,
        maintenance_type = NEW.request_type,
        updated_at = NOW()
    WHERE id = NEW.vehicle_id;
  END IF;

  IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' THEN
    UPDATE public.vehicles
    SET last_maintenance_date = COALESCE(
          NEW.scheduled_maintenance_date,
          CURRENT_DATE
        ),
        last_maintenance_odometer_km = current_odometer_km,
        updated_at = NOW()
    WHERE id = NEW.vehicle_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS vehicle_maintenance_request_completed
  ON public.vehicle_maintenance_requests;
CREATE TRIGGER vehicle_maintenance_request_completed
  AFTER UPDATE OF status, scheduled_maintenance_date
  ON public.vehicle_maintenance_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.record_completed_vehicle_maintenance();
