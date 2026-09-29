-- IT Reminder System schema (PostgreSQL / Neon)

CREATE TABLE IF NOT EXISTS tasks (
  id                 SERIAL PRIMARY KEY,
  title              TEXT NOT NULL,
  description        TEXT,
  category           TEXT NOT NULL DEFAULT 'General',
  vendor             TEXT,
  asset              TEXT,                                   -- domain, device, server, subscription ID...
  priority           TEXT NOT NULL DEFAULT 'normal'
                       CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  due_date           DATE NOT NULL,
  remind_days_before INTEGER NOT NULL DEFAULT 14 CHECK (remind_days_before >= 0),
  recurrence         TEXT NOT NULL DEFAULT 'none'
                       CHECK (recurrence IN ('none', 'weekly', 'monthly', 'quarterly', 'semiannual', 'annual')),
  cost               NUMERIC(12, 2),
  status             TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'completed')),
  snoozed_until      DATE,
  completed_at       TIMESTAMPTZ,
  completion_notes   TEXT,
  previous_task_id   INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
  last_reminded_on   DATE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tasks_open_due_idx ON tasks (due_date) WHERE status = 'open';

-- One row per reminder run (cron or manual), for auditing and to avoid double-sends.
CREATE TABLE IF NOT EXISTS reminder_runs (
  id          SERIAL PRIMARY KEY,
  run_on      DATE NOT NULL,
  trigger     TEXT NOT NULL CHECK (trigger IN ('cron', 'manual')),
  task_count  INTEGER NOT NULL,
  delivered   BOOLEAN NOT NULL,
  detail      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
