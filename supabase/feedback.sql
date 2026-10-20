-- Mobile feedback submissions and administrator review access

CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL CHECK (user_role IN ('resident', 'driver')),
  category TEXT NOT NULL CHECK (
    category IN ('Collection Service', 'Mobile App', 'Schedule', 'Other')
  ),
  message TEXT NOT NULL CHECK (length(trim(message)) > 0 AND length(message) <= 2000),
  rating SMALLINT CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS feedback_created_at_idx ON feedback (created_at DESC);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users submit own feedback" ON feedback;
DROP POLICY IF EXISTS "Users read own feedback" ON feedback;
DROP POLICY IF EXISTS "Admins read feedback" ON feedback;
DROP POLICY IF EXISTS "Admins update feedback" ON feedback;

CREATE POLICY "Users submit own feedback" ON feedback
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND user_role IN ('resident', 'driver')
  );

CREATE POLICY "Users read own feedback" ON feedback
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins read feedback" ON feedback
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users u
      WHERE u.id = auth.uid() AND u.role IN ('admin', 'administrator')
    )
  );

CREATE POLICY "Admins update feedback" ON feedback
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users u
      WHERE u.id = auth.uid() AND u.role IN ('admin', 'administrator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM system_users u
      WHERE u.id = auth.uid() AND u.role IN ('admin', 'administrator')
    )
  );
