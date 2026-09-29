import Link from "next/link";
import { notFound } from "next/navigation";
import {
  completeTaskAction,
  deleteTaskAction,
  reopenTaskAction,
  snoozeTaskAction,
  updateTaskAction,
} from "@/app/actions";
import { DueDate, PriorityLabel, StateBadge, money } from "@/components/badges";
import { TaskForm } from "@/components/TaskForm";
import { formatDate, today } from "@/lib/dates";
import { RECURRENCES, getHistory, getTask, taskState } from "@/lib/tasks";

export default async function TaskPage({ params, searchParams }: PageProps<"/tasks/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const task = Number.isInteger(Number(id)) ? await getTask(Number(id)) : null;
  if (!task) notFound();

  if (sp.edit) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <h1 className="text-xl font-semibold text-slate-900">Edit task</h1>
        <TaskForm action={updateTaskAction} task={task} submitLabel="Save changes" cancelHref={`/tasks/${task.id}`} />
      </div>
    );
  }

  const d = today();
  const state = taskState(task, d);
  const history = await getHistory(task.id);
  const open = task.status === "open";

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link href="/" className="text-sm text-slate-500 hover:text-slate-800">← All tasks</Link>

      {sp.saved && <Banner tone="slate">Saved.</Banner>}
      {sp.done && <Banner tone="green">Task closed out. Reminders for it have stopped.</Banner>}
      {sp.next && (
        <Banner tone="green">
          Previous occurrence closed out. This is the next {RECURRENCES[task.recurrence].label.toLowerCase()} occurrence —
          reminders will start {formatDate(task.remind_from)}.
        </Banner>
      )}

      <div className="card p-5">
        <div className="flex flex-wrap items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <StateBadge state={state} />
              <PriorityLabel priority={task.priority} />
            </div>
            <h1 className="mt-2 text-xl font-semibold text-slate-900">{task.title}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {[task.category, task.vendor, task.asset].filter(Boolean).join(" · ")}
            </p>
          </div>
          <Link href={`/tasks/${task.id}?edit=1`} className="btn btn-secondary">Edit</Link>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-sm sm:grid-cols-4">
          <Item label="Due"><DueDate task={task} /></Item>
          <Item label="Teams reminders">
            {open ? (
              task.snoozed_until && task.snoozed_until > d && task.days_until >= 0
                ? `Snoozed until ${formatDate(task.snoozed_until)}`
                : task.remind_from <= d
                  ? "Daily, until closed"
                  : `Start ${formatDate(task.remind_from)}`
            ) : "Stopped"}
          </Item>
          <Item label="Repeats">{RECURRENCES[task.recurrence].label}</Item>
          <Item label="Cost">{money(task.cost) ?? "—"}</Item>
        </dl>

        {task.description && (
          <p className="mt-4 whitespace-pre-wrap border-t border-slate-100 pt-4 text-sm leading-6 text-slate-700">
            {task.description}
          </p>
        )}

        {!open && (
          <div className="mt-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-900">
            <div className="font-medium">
              Completed {task.completed_at?.toLocaleDateString("en-US", { dateStyle: "medium" })}
            </div>
            {task.completion_notes && <p className="mt-1 whitespace-pre-wrap">{task.completion_notes}</p>}
          </div>
        )}
      </div>

      {open ? (
        <div className="grid gap-4 md:grid-cols-3">
          <form action={completeTaskAction} className="card space-y-3 p-5 md:col-span-2">
            <input type="hidden" name="id" value={task.id} />
            <h2 className="font-semibold text-slate-900">Close out this task</h2>
            <textarea name="completion_notes" rows={3} className="field"
              placeholder="What was done? e.g. Renewed for 1 year, PO #1234, new expiry 10/2027" />
            <div className="flex flex-wrap items-center gap-3">
              <button className="btn btn-success">Mark complete</button>
              {task.recurrence !== "none" && (
                <span className="text-xs text-slate-500">
                  The next {RECURRENCES[task.recurrence].label.toLowerCase()} occurrence will be created automatically.
                </span>
              )}
            </div>
          </form>

          <div className="card space-y-3 p-5">
            <h2 className="font-semibold text-slate-900">Snooze reminders</h2>
            <p className="text-xs text-slate-500">Pause the daily Teams nag. Overdue tasks are always included.</p>
            <div className="flex flex-wrap gap-2">
              {[1, 3, 7].map((days) => (
                <form key={days} action={snoozeTaskAction}>
                  <input type="hidden" name="id" value={task.id} />
                  <input type="hidden" name="days" value={days} />
                  <button className="btn btn-secondary">{days === 1 ? "1 day" : `${days} days`}</button>
                </form>
              ))}
              {task.snoozed_until && (
                <form action={snoozeTaskAction}>
                  <input type="hidden" name="id" value={task.id} />
                  <input type="hidden" name="days" value={0} />
                  <button className="btn text-indigo-600 hover:underline">Un-snooze</button>
                </form>
              )}
            </div>
          </div>
        </div>
      ) : (
        <form action={reopenTaskAction}>
          <input type="hidden" name="id" value={task.id} />
          <button className="btn btn-secondary">Reopen task</button>
        </form>
      )}

      {history.length > 0 && (
        <div className="card p-5">
          <h2 className="font-semibold text-slate-900">Previous occurrences</h2>
          <ul className="mt-3 divide-y divide-slate-100 text-sm">
            {history.map((h) => (
              <li key={h.id} className="flex flex-wrap gap-x-4 gap-y-1 py-2">
                <Link href={`/tasks/${h.id}`} className="w-28 font-medium text-slate-900 hover:text-indigo-700">
                  {formatDate(h.due_date)}
                </Link>
                <span className="flex-1 text-slate-600">{h.completion_notes ?? "—"}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <details className="text-sm">
        <summary className="cursor-pointer text-slate-400 hover:text-slate-600">Delete task…</summary>
        <form action={deleteTaskAction} className="mt-2 flex items-center gap-3">
          <input type="hidden" name="id" value={task.id} />
          <span className="text-slate-600">This permanently removes the task.</span>
          <button className="btn btn-danger">Delete</button>
        </form>
      </details>
    </div>
  );
}

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-1 text-slate-800">{children}</dd>
    </div>
  );
}

function Banner({ tone, children }: { tone: "green" | "slate"; children: React.ReactNode }) {
  const cls = tone === "green" ? "bg-emerald-50 text-emerald-900 ring-emerald-200" : "bg-slate-100 text-slate-700 ring-slate-200";
  return <p className={`rounded-md px-4 py-2 text-sm ring-1 ring-inset ${cls}`}>{children}</p>;
}
