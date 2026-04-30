-- Alerts table redesign (strict schema)
-- 1) Safely drop old alerts table and dependent objects
DROP TABLE IF EXISTS alerts CASCADE;

-- 2) Recreate alerts with only the required columns
CREATE TABLE alerts (
  alert_id SERIAL PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time TIME NOT NULL DEFAULT CURRENT_TIME,
  description TEXT NOT NULL
);
