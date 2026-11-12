-- Vehicle maintenance data used by the admin Vehicle Report.
-- Vehicle identity is associated with its route; when routes.vehicle_id is blank,
-- the report displays the route code as the vehicle identifier.

CREATE TABLE IF NOT EXISTS public.vehicle_maintenance_schedules (
  route_id UUID PRIMARY KEY REFERENCES public.routes(id) ON DELETE CASCADE,
  maintenance_schedule TEXT NOT NULL,
  next_maintenance_date DATE,
  updated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.vehicle_maintenance_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  service_date DATE NOT NULL,
  description TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS vehicle_maintenance_history_route_date_idx
  ON public.vehicle_maintenance_history (route_id, service_date DESC);

ALTER TABLE public.vehicle_maintenance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_maintenance_history ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.vehicle_maintenance_schedules TO authenticated;
GRANT SELECT, INSERT ON public.vehicle_maintenance_history TO authenticated;

DROP POLICY IF EXISTS "Admins manage vehicle maintenance schedules"
  ON public.vehicle_maintenance_schedules;
CREATE POLICY "Admins manage vehicle maintenance schedules"
  ON public.vehicle_maintenance_schedules
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.system_users
      WHERE system_users.id = auth.uid()
        AND system_users.role = 'admin'
    )
  )
  WITH CHECK (
    updated_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.system_users
      WHERE system_users.id = auth.uid()
        AND system_users.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins manage vehicle maintenance history"
  ON public.vehicle_maintenance_history;
CREATE POLICY "Admins manage vehicle maintenance history"
  ON public.vehicle_maintenance_history
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.system_users
      WHERE system_users.id = auth.uid()
        AND system_users.role = 'admin'
    )
  )
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.system_users
      WHERE system_users.id = auth.uid()
        AND system_users.role = 'admin'
    )
  );

ALTER TABLE public.generated_reports
  DROP CONSTRAINT IF EXISTS generated_reports_report_type_check;
ALTER TABLE public.generated_reports
  ADD CONSTRAINT generated_reports_report_type_check
  CHECK (
    report_type IN (
      'collection',
      'barangay',
      'complaint',
      'driver',
      'route',
      'user',
      'vehicle'
    )
  );
