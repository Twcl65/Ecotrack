-- Sync driver collection entries into the admin's daily Collection Report.

ALTER TABLE public.driver_garbage_collections
  ADD COLUMN IF NOT EXISTS collection_mode TEXT;

UPDATE public.driver_garbage_collections
SET collection_mode = CASE
  WHEN jsonb_array_length(materials) = 0 THEN 'input'
  ELSE 'calculate'
END
WHERE collection_mode IS NULL;

ALTER TABLE public.driver_garbage_collections
  ALTER COLUMN collection_mode SET NOT NULL;
ALTER TABLE public.driver_garbage_collections
  DROP CONSTRAINT IF EXISTS driver_garbage_collections_collection_mode_check;
ALTER TABLE public.driver_garbage_collections
  ADD CONSTRAINT driver_garbage_collections_collection_mode_check
  CHECK (collection_mode IN ('input', 'calculate'));

ALTER TABLE public.monthly_collection_reports
  ADD COLUMN IF NOT EXISTS total_sacks INTEGER NOT NULL DEFAULT 0
  CHECK (total_sacks >= 0);

ALTER TABLE public.driver_garbage_collections
  ADD COLUMN IF NOT EXISTS sack_count INTEGER
  CHECK (sack_count >= 0),
  ADD COLUMN IF NOT EXISTS total_kg NUMERIC(12, 2)
  CHECK (total_kg >= 0);

ALTER TABLE public.driver_garbage_collections
  ALTER COLUMN sack_count DROP DEFAULT,
  ALTER COLUMN sack_count DROP NOT NULL,
  ALTER COLUMN total_kg DROP DEFAULT,
  ALTER COLUMN total_kg DROP NOT NULL;

ALTER TABLE public.driver_garbage_collection_dates
  ADD COLUMN IF NOT EXISTS collection_mode TEXT;

UPDATE public.driver_garbage_collection_dates AS claimed
SET collection_mode = COALESCE(
  (
    SELECT collection.collection_mode
    FROM public.driver_garbage_collections AS collection
    WHERE collection.driver_id = claimed.driver_id
      AND collection.schedule_date = claimed.schedule_date
    ORDER BY collection.created_at DESC, collection.id DESC
    LIMIT 1
  ),
  'input'
)
WHERE collection_mode IS NULL;

ALTER TABLE public.driver_garbage_collection_dates
  ALTER COLUMN collection_mode SET NOT NULL;
ALTER TABLE public.driver_garbage_collection_dates
  DROP CONSTRAINT IF EXISTS driver_garbage_collection_dates_pkey;
ALTER TABLE public.driver_garbage_collection_dates
  ADD CONSTRAINT driver_garbage_collection_dates_pkey
  PRIMARY KEY (driver_id, schedule_date, collection_mode);

ALTER TABLE public.driver_garbage_collection_dates
  DROP CONSTRAINT IF EXISTS driver_garbage_collection_dates_collection_mode_check;
ALTER TABLE public.driver_garbage_collection_dates
  ADD CONSTRAINT driver_garbage_collection_dates_collection_mode_check
  CHECK (collection_mode IN ('input', 'calculate'));

INSERT INTO public.driver_garbage_collection_dates (
  driver_id,
  schedule_date,
  collection_mode
)
SELECT DISTINCT driver_id, schedule_date, collection_mode
FROM public.driver_garbage_collections
ON CONFLICT (driver_id, schedule_date, collection_mode) DO NOTHING;

CREATE OR REPLACE FUNCTION public.prevent_duplicate_driver_garbage_collection()
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

  IF NEW.collection_mode IS NULL THEN
    NEW.collection_mode := CASE
      WHEN jsonb_array_length(NEW.materials) = 0 THEN 'input'
      ELSE 'calculate'
    END;
  END IF;

  INSERT INTO public.driver_garbage_collection_dates (
    driver_id,
    schedule_date,
    collection_mode
  )
  VALUES (NEW.driver_id, NEW.schedule_date, NEW.collection_mode)
  ON CONFLICT (driver_id, schedule_date, collection_mode) DO NOTHING;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'This collection mode is already saved for the driver and date.'
      USING
        ERRCODE = '23505',
        CONSTRAINT = 'driver_garbage_collection_dates_pkey';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_duplicate_driver_garbage_collection
  ON public.driver_garbage_collections;

CREATE TRIGGER prevent_duplicate_driver_garbage_collection
  BEFORE INSERT ON public.driver_garbage_collections
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_duplicate_driver_garbage_collection();

CREATE OR REPLACE FUNCTION public.calculate_driver_collection_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
DECLARE
  collected_kg NUMERIC;
  collected_sacks NUMERIC;
BEGIN
  SELECT
    COALESCE(
      SUM((item->>'quantity')::NUMERIC) FILTER (WHERE item->>'unit' = 'kg'),
      0
    ),
    COALESCE(
      SUM((item->>'quantity')::NUMERIC) FILTER (
        WHERE item->>'unit' = 'piece'
          AND (
            item->>'id' = 'sack'
            OR LOWER(BTRIM(item->>'name')) IN ('sack', 'sacks')
          )
      ),
      0
    )
  INTO collected_kg, collected_sacks
  FROM jsonb_array_elements(NEW.materials) AS materials(item);

  IF NEW.sack_count IS NULL AND collected_sacks <> TRUNC(collected_sacks) THEN
    RAISE EXCEPTION 'Sack quantities must be whole numbers.'
      USING ERRCODE = '22023';
  END IF;

  NEW.total_kg := COALESCE(NEW.total_kg, ROUND(collected_kg, 2));
  NEW.sack_count := COALESCE(NEW.sack_count, collected_sacks::INTEGER);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS calculate_driver_collection_totals
  ON public.driver_garbage_collections;

CREATE TRIGGER calculate_driver_collection_totals
  BEFORE INSERT ON public.driver_garbage_collections
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_driver_collection_totals();

UPDATE public.driver_garbage_collections AS collection
SET
  total_kg = (
    SELECT ROUND(
      COALESCE(
        SUM((item->>'quantity')::NUMERIC) FILTER (WHERE item->>'unit' = 'kg'),
        0
      ), 2
    )
    FROM jsonb_array_elements(collection.materials) AS materials(item)
  ),
  sack_count = (
    SELECT COALESCE(
      SUM((item->>'quantity')::NUMERIC) FILTER (
        WHERE item->>'unit' = 'piece'
          AND (
            item->>'id' = 'sack'
            OR LOWER(BTRIM(item->>'name')) IN ('sack', 'sacks')
          )
      ),
      0
    )::INTEGER
    FROM jsonb_array_elements(collection.materials) AS materials(item)
  )
WHERE collection_mode = 'calculate';

UPDATE public.driver_garbage_collections
SET
  sack_count = COALESCE(sack_count, 0),
  total_kg = COALESCE(total_kg, 0)
WHERE collection_mode = 'input';

ALTER TABLE public.driver_garbage_collections
  ALTER COLUMN sack_count SET NOT NULL,
  ALTER COLUMN total_kg SET NOT NULL;

-- Populate missing report days from existing driver records without adding to
-- dates that may already contain an admin-entered total.
INSERT INTO public.monthly_collection_reports (
  report_year,
  month_number,
  day_number,
  total_sacks,
  total_kg,
  updated_by
)
SELECT
  EXTRACT(YEAR FROM schedule_date)::INTEGER,
  EXTRACT(MONTH FROM schedule_date)::SMALLINT,
  EXTRACT(DAY FROM schedule_date)::SMALLINT,
  SUM(sack_count)::INTEGER,
  SUM(total_kg),
  MIN(driver_id::TEXT)::UUID
FROM public.driver_garbage_collections
WHERE collection_mode = 'input'
GROUP BY schedule_date
ON CONFLICT (report_year, month_number, day_number) DO NOTHING;

CREATE OR REPLACE FUNCTION public.sync_driver_collection_report()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NEW.collection_mode <> 'input' THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.monthly_collection_reports (
    report_year,
    month_number,
    day_number,
    total_sacks,
    total_kg,
    updated_by,
    updated_at
  )
  VALUES (
    EXTRACT(YEAR FROM NEW.schedule_date)::INTEGER,
    EXTRACT(MONTH FROM NEW.schedule_date)::SMALLINT,
    EXTRACT(DAY FROM NEW.schedule_date)::SMALLINT,
    NEW.sack_count,
    NEW.total_kg,
    NEW.driver_id,
    NOW()
  )
  ON CONFLICT (report_year, month_number, day_number)
  DO UPDATE SET
    total_sacks = monthly_collection_reports.total_sacks + EXCLUDED.total_sacks,
    total_kg = monthly_collection_reports.total_kg + EXCLUDED.total_kg,
    updated_by = EXCLUDED.updated_by,
    updated_at = NOW();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_driver_collection_report
  ON public.driver_garbage_collections;

CREATE TRIGGER sync_driver_collection_report
  AFTER INSERT ON public.driver_garbage_collections
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_driver_collection_report();
