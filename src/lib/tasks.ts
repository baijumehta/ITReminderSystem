import { db } from "./db";
import { today } from "./dates";

export const CATEGORIES = [
  "Certificates",
  "Security Subscriptions",
  "Licensing",
  "Domains",
  "Hardware",
  "Patching",
  "Backups",
  "Accounts & Access",
  "Compliance",
  "General",
] as const;

export const PRIORITIES = ["low", "normal", "high", "critical"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const RECURRENCES = {
  none: { label: "One-time", interval: null },
  weekly: { label: "Weekly", interval: "1 week" },
  monthly: { label: "Monthly", interval: "1 month" },
  quarterly: { label: "Quarterly", interval: "3 months" },
  semiannual: { label: "Every 6 months", interval: "6 months" },
  annual: { label: "Yearly", interval: "1 year" },
} as const;
export type Recurrence = keyof typeof RECURRENCES;

export type Task = {
  id: number;
  title: string;
  description: string | null;
  category: string;
  vendor: string | null;
  asset: string | null;
  priority: Priority;
  due_date: string;
  remind_days_before: number;
  recurrence: Recurrence;
  cost: string | null;
  status: "open" | "completed";
  snoozed_until: string | null;
  completed_at: Date | null;
  completion_notes: string | null;
  previous_task_id: number | null;
  last_reminded_on: string | null;
  created_at: Date;
  // Derived
  days_until: number;
  remind_from: string;
};

/** Where a task sits relative to today; drives colours and reminder grouping. */
export type TaskState = "completed" | "overdue" | "due-soon" | "reminding" | "snoozed" | "upcoming";

export function taskState(t: Task, todayStr = today()): TaskState {
  if (t.status === "completed") return "completed";
  if (t.days_until < 0) return "overdue";
  if (t.snoozed_until && t.snoozed_until > todayStr) return "snoozed";
  if (t.days_until <= 7) return "due-soon";
  if (t.remind_from <= todayStr) return "reminding";
  return "upcoming";
}

// DATE columns come back as text so they never get shifted by server time zones.
const COLUMNS = (t: string) => `
  ${t}.id, ${t}.title, ${t}.description, ${t}.category, ${t}.vendor, ${t}.asset, ${t}.priority,
  ${t}.due_date::text AS due_date, ${t}.remind_days_before, ${t}.recurrence, ${t}.cost::text AS cost,
  ${t}.status, ${t}.snoozed_until::text AS snoozed_until, ${t}.completed_at, ${t}.completion_notes,
  ${t}.previous_task_id, ${t}.last_reminded_on::text AS last_reminded_on, ${t}.created_at,
  (${t}.due_date - ${t}.remind_days_before)::text AS remind_from`;

export type TaskFilter = { status?: "open" | "completed" | "all"; category?: string; q?: string };

export async function listTasks(filter: TaskFilter = {}): Promise<Task[]> {
  const sql = db();
  const d = today();
  const status = filter.status ?? "open";
  const q = filter.q?.trim() ? `%${filter.q.trim()}%` : null;
  return sql<Task[]>`
    SELECT ${sql.unsafe(COLUMNS("t"))}, (t.due_date - ${d}::date) AS days_until
    FROM tasks t
    WHERE (${status} = 'all' OR t.status = ${status})
      AND (${filter.category ?? null}::text IS NULL OR t.category = ${filter.category ?? null})
      AND (${q}::text IS NULL OR t.title ILIKE ${q} OR t.vendor ILIKE ${q} OR t.asset ILIKE ${q})
    ORDER BY
      CASE WHEN t.status = 'open' THEN 0 ELSE 1 END,
      CASE WHEN t.status = 'open' THEN t.due_date END ASC,
      t.completed_at DESC NULLS LAST`;
}

export async function getTask(id: number): Promise<Task | null> {
  const sql = db();
  const rows = await sql<Task[]>`
    SELECT ${sql.unsafe(COLUMNS("t"))}, (t.due_date - ${today()}::date) AS days_until
    FROM tasks t WHERE t.id = ${id}`;
  return rows[0] ?? null;
}

/** Earlier occurrences of a recurring task (walks the previous_task_id chain). */
export async function getHistory(id: number): Promise<Task[]> {
  const sql = db();
  return sql<Task[]>`
    WITH RECURSIVE chain AS (
      SELECT * FROM tasks WHERE id = (SELECT previous_task_id FROM tasks WHERE id = ${id})
      UNION ALL
      SELECT p.* FROM tasks p JOIN chain c ON p.id = c.previous_task_id
    )
    SELECT ${sql.unsafe(COLUMNS("chain"))}, (chain.due_date - ${today()}::date) AS days_until
    FROM chain ORDER BY chain.due_date DESC LIMIT 24`;
}

export async function getCategoriesInUse(): Promise<string[]> {
  const rows = await db()<{ category: string }[]>`SELECT DISTINCT category FROM tasks ORDER BY category`;
  return rows.map((r) => r.category);
}

export type TaskInput = {
  title: string;
  description: string | null;
  category: string;
  vendor: string | null;
  asset: string | null;
  priority: Priority;
  due_date: string;
  remind_days_before: number;
  recurrence: Recurrence;
  cost: number | null;
};

export async function createTask(input: TaskInput): Promise<number> {
  const [row] = await db()<{ id: number }[]>`
    INSERT INTO tasks ${db()(input)} RETURNING id`;
  return row.id;
}

export async function updateTask(id: number, input: TaskInput) {
  await db()`UPDATE tasks SET ${db()(input)}, updated_at = now() WHERE id = ${id}`;
}

/**
 * Close out a task. For recurring tasks the next occurrence is created
 * automatically so renewals never fall off the list. Returns the new task id.
 */
export async function completeTask(id: number, notes: string | null): Promise<number | null> {
  return db().begin(async (tx) => {
    const [task] = await tx<{ recurrence: Recurrence; status: string }[]>`
      UPDATE tasks
      SET status = 'completed', completed_at = now(), completion_notes = ${notes},
          snoozed_until = NULL, updated_at = now()
      WHERE id = ${id} AND status = 'open'
      RETURNING recurrence, status`;
    if (!task) return null;

    const interval = RECURRENCES[task.recurrence]?.interval;
    if (!interval) return null;

    const [next] = await tx<{ id: number }[]>`
      INSERT INTO tasks (title, description, category, vendor, asset, priority, due_date,
                         remind_days_before, recurrence, cost, previous_task_id)
      SELECT title, description, category, vendor, asset, priority,
             (due_date + ${interval}::interval)::date,
             remind_days_before, recurrence, cost, id
      FROM tasks WHERE id = ${id}
      RETURNING id`;
    return next.id;
  }) as Promise<number | null>;
}

export async function reopenTask(id: number) {
  await db()`
    UPDATE tasks SET status = 'open', completed_at = NULL, updated_at = now()
    WHERE id = ${id}`;
}

export async function snoozeTask(id: number, until: string | null) {
  await db()`UPDATE tasks SET snoozed_until = ${until}, updated_at = now() WHERE id = ${id}`;
}

export async function deleteTask(id: number) {
  await db()`DELETE FROM tasks WHERE id = ${id}`;
}

/** Open tasks inside their reminder window and not snoozed (overdue tasks ignore snoozes). */
export async function tasksNeedingReminder(d = today()): Promise<Task[]> {
  const sql = db();
  return sql<Task[]>`
    SELECT ${sql.unsafe(COLUMNS("t"))}, (t.due_date - ${d}::date) AS days_until
    FROM tasks t
    WHERE t.status = 'open'
      AND t.due_date - t.remind_days_before <= ${d}::date
      AND (t.snoozed_until IS NULL OR t.snoozed_until <= ${d}::date OR t.due_date < ${d}::date)
    ORDER BY t.due_date ASC,
      CASE t.priority WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END`;
}

export async function markReminded(ids: number[], d = today()) {
  if (!ids.length) return;
  await db()`UPDATE tasks SET last_reminded_on = ${d} WHERE id = ANY(${ids})`;
}

export type ReminderRun = {
  id: number;
  run_on: string;
  trigger: "cron" | "manual";
  task_count: number;
  delivered: boolean;
  detail: string | null;
  created_at: Date;
};

export async function recordRun(run: Omit<ReminderRun, "id" | "created_at">) {
  await db()`INSERT INTO reminder_runs ${db()(run)}`;
}

export async function recentRuns(limit = 10): Promise<ReminderRun[]> {
  return db()<ReminderRun[]>`
    SELECT id, run_on::text AS run_on, trigger, task_count, delivered, detail, created_at
    FROM reminder_runs ORDER BY created_at DESC LIMIT ${limit}`;
}

export async function deliveredToday(d = today()): Promise<boolean> {
  const rows = await db()`
    SELECT 1 FROM reminder_runs WHERE run_on = ${d} AND trigger = 'cron' AND delivered LIMIT 1`;
  return rows.length > 0;
}
