-- PPE log-only migration
-- Purpose: remove PPE table storage and emit structured PPE events to PostgreSQL server logs.

-- 1) Drop legacy PPE storage tables.
DROP TABLE IF EXISTS ppe_alert_logs CASCADE;
DROP TABLE IF EXISTS ppe_log CASCADE;

-- 2) Configure PostgreSQL server logging for structured logs.
--    Note: logging_collector change requires PostgreSQL restart to take full effect.
ALTER SYSTEM SET log_destination = 'jsonlog';
ALTER SYSTEM SET logging_collector = 'on';
ALTER SYSTEM SET log_directory = 'log';
ALTER SYSTEM SET log_filename = 'ppe_alerts.log';
ALTER SYSTEM SET log_statement = 'none';
SELECT pg_reload_conf();

-- 3) Function used by backend to write a structured PPE event into PostgreSQL logs.
DROP FUNCTION IF EXISTS public.log_ppe_alert(UUID, BOOLEAN, BOOLEAN, BOOLEAN);

CREATE OR REPLACE FUNCTION public.log_ppe_alert(
  alertid UUID,
  helmet BOOLEAN,
  vest BOOLEAN,
  glove BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  event_date TEXT;
  event_time TEXT;
  description TEXT;
  payload JSONB;
BEGIN
  event_date := to_char(clock_timestamp(), 'YYYY-MM-DD');
  event_time := to_char(clock_timestamp(), 'HH24:MI:SS');

  description := CASE
    WHEN helmet OR vest OR glove THEN 'PPE Not detected'
    ELSE 'No alert generated'
  END;

  payload := jsonb_build_object(
    'alertid', alertid::TEXT,
    'date', event_date,
    'time', event_time,
    'description', description,
    'helmet', helmet,
    'vest', vest,
    'glove', glove
  );

  RAISE LOG 'PPE_ALERT: %', payload::TEXT;
END;
$$;
