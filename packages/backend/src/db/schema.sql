CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── ROLES & USERS ─────────────────────────────────────────────────────────────
-- Roles: admin (full access), editor (run agents + view), viewer (read-only)
CREATE TABLE IF NOT EXISTS roles (
  id    SERIAL PRIMARY KEY,
  name  TEXT NOT NULL UNIQUE  -- 'admin' | 'editor' | 'viewer'
);

INSERT INTO roles (name) VALUES ('admin'), ('editor'), ('viewer')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS users (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT        NOT NULL,
  email         TEXT        NOT NULL UNIQUE,
  password_hash TEXT        NOT NULL,
  role_id       INTEGER     NOT NULL REFERENCES roles(id) DEFAULT 3,
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ── AGENT OUTPUTS ─────────────────────────────────────────────────────────────
-- Local searchable copy of every agent run. Notion writes still happen in parallel;
-- notion_url is nullable so a Notion failure never blocks a run.
CREATE TABLE IF NOT EXISTS agent_outputs (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id      TEXT        NOT NULL,
  agent_name    TEXT        NOT NULL,
  team_member   TEXT        NOT NULL,
  task_type     TEXT        NOT NULL,
  output_text   TEXT        NOT NULL,
  notion_url    TEXT,
  model_used    TEXT        NOT NULL,
  score         SMALLINT,
  status        TEXT        NOT NULL DEFAULT 'draft',
  tokens_used   INTEGER,
  duration_ms   INTEGER,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_outputs_agent_id   ON agent_outputs(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_outputs_created_at ON agent_outputs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_outputs_status     ON agent_outputs(status);

-- ── KB MODULE METADATA ────────────────────────────────────────────────────────
-- Tracks which KB files exist, their last-modified time, and completion state.
CREATE TABLE IF NOT EXISTS kb_modules (
  id            TEXT        PRIMARY KEY,
  label         TEXT        NOT NULL,
  file_path     TEXT        NOT NULL,
  status        TEXT        NOT NULL DEFAULT 'pending',
  fill_in_count INTEGER     NOT NULL DEFAULT 0,
  char_count    INTEGER     NOT NULL DEFAULT 0,
  last_synced   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── JOB RUNS ──────────────────────────────────────────────────────────────────
-- Audit log for every Bull job (scheduled + manual).
CREATE TABLE IF NOT EXISTS job_runs (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_name      TEXT        NOT NULL,
  agent_id      TEXT        NOT NULL,
  task_type     TEXT        NOT NULL,
  trigger       TEXT        NOT NULL,
  status        TEXT        NOT NULL DEFAULT 'pending',
  output_id     UUID        REFERENCES agent_outputs(id),
  error_message TEXT,
  started_at    TIMESTAMPTZ,
  finished_at   TIMESTAMPTZ,
  duration_ms   INTEGER,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_runs_agent_id   ON job_runs(agent_id);
CREATE INDEX IF NOT EXISTS idx_job_runs_status     ON job_runs(status);
CREATE INDEX IF NOT EXISTS idx_job_runs_created_at ON job_runs(created_at DESC);
