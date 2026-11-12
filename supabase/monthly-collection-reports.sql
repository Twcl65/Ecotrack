-- Admin-entered monthly collection report totals for the Collection Report page.

CREATE TABLE IF NOT EXISTS public.monthly_collection_reports (
  report_year INTEGER NOT NULL CHECK (report_year BETWEEN 2000 AND 9999),
  month_number SMALLINT NOT NULL CHECK (month_number BETWEEN 1 AND 12),
  day_number SMALLINT NOT NULL DEFAULT 1 CHECK (day_number BETWEEN 1 AND 31),
  total_kg NUMERIC(12, 2) NOT NULL CHECK (total_kg >= 0),
  updated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (report_year, month_number, day_number)
);

-- Upgrade the earlier one-record-per-month version; old monthly totals become day 1.
ALTER TABLE public.monthly_collection_reports
  ADD COLUMN IF NOT EXISTS day_number SMALLINT NOT NULL DEFAULT 1
  CHECK (day_number BETWEEN 1 AND 31);

ALTER TABLE public.monthly_collection_reports
  DROP CONSTRAINT IF EXISTS monthly_collection_reports_pkey;
ALTER TABLE public.monthly_collection_reports
  ADD CONSTRAINT monthly_collection_reports_pkey
  PRIMARY KEY (report_year, month_number, day_number);

ALTER TABLE public.monthly_collection_reports ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.monthly_collection_reports TO authenticated;

DROP POLICY IF EXISTS "Admins read monthly collection reports"
  ON public.monthly_collection_reports;
DROP POLICY IF EXISTS "Admins insert monthly collection reports"
  ON public.monthly_collection_reports;
DROP POLICY IF EXISTS "Admins update monthly collection reports"
  ON public.monthly_collection_reports;

CREATE POLICY "Admins read monthly collection reports"
  ON public.monthly_collection_reports
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.system_users
      WHERE system_users.id = auth.uid()
        AND system_users.role = 'admin'
    )
  );

CREATE POLICY "Admins insert monthly collection reports"
  ON public.monthly_collection_reports
  FOR INSERT TO authenticated
  WITH CHECK (
    updated_by = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.system_users
      WHERE system_users.id = auth.uid()
        AND system_users.role = 'admin'
    )
  );

CREATE POLICY "Admins update monthly collection reports"
  ON public.monthly_collection_reports
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.system_users
      WHERE system_users.id = auth.uid()
        AND system_users.role = 'admin'
    )
  )
  WITH CHECK (
    updated_by = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.system_users
      WHERE system_users.id = auth.uid()
        AND system_users.role = 'admin'
    )
  );
