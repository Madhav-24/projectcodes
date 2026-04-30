-- ============================================================
-- PPE Safety App — PostgreSQL Schema
-- Run once against your database: psql $DATABASE_URL -f schema.sql
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Users ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(255)  NOT NULL,
  email           VARCHAR(255)  UNIQUE NOT NULL,
  password_hash   VARCHAR(255)  NOT NULL,
  role            VARCHAR(50)   NOT NULL DEFAULT 'engineer',
  employee_id     VARCHAR(100)  UNIQUE,
  phone_number    VARCHAR(20),
  assigned_site   VARCHAR(255),
  status          VARCHAR(20)   NOT NULL DEFAULT 'active',
  permissions     JSONB         NOT NULL DEFAULT '{"canViewDashboard":true,"canViewCharts":true,"canMessageRoles":["admin","supervisor","engineer","project_manager"]}',
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email       ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_employee_id ON users(employee_id);
CREATE INDEX IF NOT EXISTS idx_users_role        ON users(role);

-- ── Safety Alerts (Strict PPE Schema) ───────────────────────
-- Drop existing alerts table and dependent objects safely.
DROP TABLE IF EXISTS alerts CASCADE;

CREATE TABLE alerts (
  alert_id        SERIAL PRIMARY KEY,
  date            DATE   NOT NULL DEFAULT CURRENT_DATE,
  time            TIME   NOT NULL DEFAULT CURRENT_TIME,
  description     TEXT   NOT NULL
);

-- ── Messages ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id       UUID          REFERENCES users(id) ON DELETE SET NULL,
  sender_name     VARCHAR(255),
  sender_role     VARCHAR(50),
  receiver_id     UUID          REFERENCES users(id) ON DELETE CASCADE,
  text            TEXT          NOT NULL DEFAULT '',
  read            BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id   ON messages(sender_id);

-- ── Message Attachments ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS message_attachments (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id      UUID          NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  name            VARCHAR(255),
  mime_type       VARCHAR(100),
  size            BIGINT,
  url             TEXT,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attachments_message_id ON message_attachments(message_id);
