-- Push notification device registration and database event queue.
-- Run this in the Supabase SQL Editor.
-- Requires the existing profiles, system_users, announcements,
-- collection_schedules, and complaints tables.
--
-- Deploy the sender function with:
--   supabase functions deploy send-push --no-verify-jwt
-- Set its shared webhook secret with:
--   supabase secrets set PUSH_WEBHOOK_SECRET=<a-long-random-secret>
-- Then create a Database Webhook for INSERT on public.push_events targeting:
--   https://<project-ref>.supabase.co/functions/v1/send-push
-- Add the header Authorization: Bearer <the-same-secret>.

CREATE TABLE IF NOT EXISTS public.push_tokens (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expo_push_token TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('administrator', 'driver', 'viewer')),
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, expo_push_token)
);

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.push_tokens FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_tokens TO authenticated;

DROP POLICY IF EXISTS "Users manage own push tokens" ON public.push_tokens;
CREATE POLICY "Users manage own push tokens"
ON public.push_tokens
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid()
  AND role = (
    COALESCE(
      (
        SELECT CASE su.role
          WHEN 'admin' THEN 'administrator'
          WHEN 'resident' THEN 'viewer'
          ELSE su.role
        END
        FROM public.system_users AS su
        WHERE su.id = auth.uid()
      ),
      (
        SELECT profile.role
        FROM public.profiles AS profile
        WHERE profile.id = auth.uid()
      )
    )
  )
);

CREATE TABLE IF NOT EXISTS public.push_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  recipient_role TEXT CHECK (
    recipient_role IS NULL OR recipient_role IN ('administrator', 'driver', 'viewer')
  ),
  recipient_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT push_events_recipient_check CHECK (
    (recipient_role IS NOT NULL AND recipient_user_id IS NULL)
    OR (recipient_role IS NULL AND recipient_user_id IS NOT NULL)
  )
);

ALTER TABLE public.push_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.push_events FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.enqueue_push_event(
  p_role TEXT,
  p_user_id UUID,
  p_title TEXT,
  p_body TEXT,
  p_data JSONB
)
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = ''
AS $$
  INSERT INTO public.push_events (
    recipient_role,
    recipient_user_id,
    title,
    body,
    data
  )
  VALUES (p_role, p_user_id, left(p_title, 120), left(p_body, 500), p_data);
$$;
REVOKE ALL ON FUNCTION public.enqueue_push_event(TEXT, UUID, TEXT, TEXT, JSONB)
FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.notify_published_announcement()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.archived_at IS NOT NULL
     OR NEW.publish_status <> 'publish_now'
     OR (NEW.published_at IS NOT NULL AND NEW.published_at > NOW()) THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE'
     AND OLD.publish_status = 'publish_now'
     AND OLD.archived_at IS NULL
     AND OLD.published_at IS NOT DISTINCT FROM NEW.published_at
     AND OLD.title IS NOT DISTINCT FROM NEW.title
     AND OLD.content IS NOT DISTINCT FROM NEW.content
     AND OLD.audience IS NOT DISTINCT FROM NEW.audience THEN
    RETURN NEW;
  END IF;

  -- Barangay-scoped announcements are skipped because users have no barangay field.
  IF NEW.audience = 'all_residents' THEN
    PERFORM public.enqueue_push_event(
      'viewer',
      NULL,
      NEW.title,
      NEW.content,
      jsonb_build_object('kind', 'announcement', 'id', NEW.id)
    );
  ELSIF NEW.audience = 'staff' THEN
    PERFORM public.enqueue_push_event(
      'administrator',
      NULL,
      NEW.title,
      NEW.content,
      jsonb_build_object('kind', 'announcement', 'id', NEW.id)
    );
    PERFORM public.enqueue_push_event(
      'driver',
      NULL,
      NEW.title,
      NEW.content,
      jsonb_build_object('kind', 'announcement', 'id', NEW.id)
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS announcements_push_notification ON public.announcements;
CREATE TRIGGER announcements_push_notification
AFTER INSERT OR UPDATE OF publish_status, published_at, archived_at, title, content, audience
ON public.announcements
FOR EACH ROW EXECUTE FUNCTION public.notify_published_announcement();

CREATE OR REPLACE FUNCTION public.publish_due_announcements_for_push()
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = ''
AS $$
  UPDATE public.announcements
  SET publish_status = 'publish_now'
  WHERE publish_status = 'scheduled'
    AND published_at <= NOW()
    AND archived_at IS NULL;
$$;
REVOKE ALL ON FUNCTION public.publish_due_announcements_for_push()
FROM PUBLIC, anon, authenticated;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_available_extensions
    WHERE name = 'pg_cron'
  ) THEN
    EXECUTE 'CREATE EXTENSION IF NOT EXISTS pg_cron';
    PERFORM cron.unschedule(jobid)
    FROM cron.job
    WHERE jobname = 'ecotrack-publish-due-announcements';
    PERFORM cron.schedule(
      'ecotrack-publish-due-announcements',
      '* * * * *',
      'SELECT public.publish_due_announcements_for_push();'
    );
  ELSE
    RAISE NOTICE 'pg_cron is unavailable; scheduled announcements will not push automatically.';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_collection_schedule_change()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_title TEXT;
  v_body TEXT;
  v_data JSONB;
BEGIN
  IF NEW.archived_at IS NOT NULL
     OR NEW.status IN ('canceled', 'no_collection', 'maintenance') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE'
     AND OLD.collection_date IS NOT DISTINCT FROM NEW.collection_date
     AND OLD.driver IS NOT DISTINCT FROM NEW.driver
     AND OLD.barangay IS NOT DISTINCT FROM NEW.barangay
     AND OLD.status IS NOT DISTINCT FROM NEW.status
     AND OLD.archived_at IS NOT DISTINCT FROM NEW.archived_at THEN
    RETURN NEW;
  END IF;

  v_title := CASE
    WHEN NEW.status = 'ongoing' THEN 'Collection started'
    WHEN NEW.status = 'completed' THEN 'Collection completed'
    ELSE 'Collection schedule updated'
  END;
  v_body := format('Collection in %s on %s is %s.',
    NEW.barangay,
    to_char(NEW.collection_date, 'Mon FMDD, YYYY'),
    replace(NEW.status, '_', ' ')
  );
  v_data := jsonb_build_object('kind', 'schedule', 'id', NEW.id);

  PERFORM public.enqueue_push_event('viewer', NULL, v_title, v_body, v_data);

  IF NULLIF(btrim(NEW.driver), '') IS NOT NULL THEN
    INSERT INTO public.push_events (
      recipient_user_id,
      title,
      body,
      data
    )
    SELECT
      su.id,
      v_title,
      v_body,
      v_data
    FROM public.system_users AS su
    WHERE su.role = 'driver'
      AND su.status = 'active'
      AND su.archived_at IS NULL
      AND lower(regexp_replace(
        btrim(concat_ws(' ', su.first_name, su.middle_name, su.last_name)),
        '\s+', ' ', 'g'
      ))
        = lower(regexp_replace(btrim(NEW.driver), '\s+', ' ', 'g'));
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS collection_schedules_push_notification
ON public.collection_schedules;
CREATE TRIGGER collection_schedules_push_notification
AFTER INSERT OR UPDATE OF collection_date, driver, barangay, status, archived_at
ON public.collection_schedules
FOR EACH ROW EXECUTE FUNCTION public.notify_collection_schedule_change();

CREATE OR REPLACE FUNCTION public.notify_complaint_change()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.enqueue_push_event(
      'administrator',
      NULL,
      'New resident complaint',
      format('%s in %s', NEW.issue, NEW.barangay),
      jsonb_build_object('kind', 'complaint', 'id', NEW.id)
    );
  ELSIF NEW.status IS DISTINCT FROM OLD.status
        AND NEW.resident_id IS NOT NULL THEN
    INSERT INTO public.push_events (
      recipient_user_id,
      title,
      body,
      data
    )
    VALUES (
      NEW.resident_id,
      'Complaint status updated',
      format('Your complaint %s is now %s.', NEW.complaint_code, replace(NEW.status, '_', ' ')),
      jsonb_build_object('kind', 'complaint', 'id', NEW.id)
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS complaints_push_notification ON public.complaints;
CREATE TRIGGER complaints_push_notification
AFTER INSERT OR UPDATE OF status
ON public.complaints
FOR EACH ROW EXECUTE FUNCTION public.notify_complaint_change();
