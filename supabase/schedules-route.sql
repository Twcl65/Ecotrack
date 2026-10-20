-- Link collection schedules to routes (run in Supabase SQL Editor)

ALTER TABLE collection_schedules
  ADD COLUMN IF NOT EXISTS route_id UUID REFERENCES routes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_collection_schedules_route
  ON collection_schedules(route_id);
