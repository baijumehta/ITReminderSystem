import Link from "next/link";
import { DueDate, PriorityLabel, StateBadge, money } from "@/components/badges";
import { today } from "@/lib/dates";
import { RECURRENCES, getCategoriesInUse, listTasks, taskState, tasksNeedingReminder, type TaskFilter } from "@/lib/tasks";

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function Dashboard({ searchParams }: PageProps<"/">) {
  const sp = await searchParams;
  const status = (one(sp.status) ?? "open") as TaskFilter["status"];
  const category = one(sp.category) || undefined;
  const q = one(sp.q) || undefined;

  const d = today();
  const [open, tasks, categories, reminding] = await Promise.all([
    listTasks({ status: "open" }),
    listTasks({ status, category, q }),
    getCategoriesInUse(),
    tasksNeedingReminder(d),
  ]);

  const states = open.map((t) => taskState(t, d));
  const overdue = states.filter((s) => s === "overdue").length;
  const dueSoon = states.filter((s) => s === "due-soon").length;
  const spend90 = open
    .filter((t) => t.days_until <= 90 && t.cost)
    .reduce((sum, t) => sum + Number(t.cost), 0);

  const filtered = status !== "open" || category || q;

  return (
    <div className="space-y-6">
      {one(sp.deleted) && (
        <p className="rounded-md bg-slate-100 px-4 py-2 text-sm text-slate-700">Task deleted.</p>
      )}

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Overdue" value={overdue} tone={overdue ? "red" : "slate"} />
        <Stat label="Due in the next 7 days" value={dueSoon} tone={dueSoon ? "amber" : "slate"} />
        <Stat label="In today's Teams reminder" value={reminding.length} tone="indigo" href="/preview" />
        <Stat label="Renewal spend, next 90 days" value={money(spend90) ?? "$0"} tone="slate" />
      </section>

      <section className="card">
        <form className="flex flex-wrap items-end gap-3 border-b border-slate-200 p-4" action="/">
          <div className="min-w-48 flex-1">
            <label className="label" htmlFor="q">Search</label>
            <input id="q" name="q" defaultValue={q} placeholder="Title, vendor, asset…" className="field" />
          </div>
          <div>
            <label className="label" htmlFor="category">Category</label>
            <select id="category" name="category" defaultValue={category ?? ""} className="field">
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="status">Status</label>
            <select id="status" name="status" defaultValue={status} className="field">
              <option value="open">Open</option>
              <option value="completed">Completed</option>
              <option value="all">All</option>
            </select>
          </div>
          <button className="btn btn-secondary">Filter</button>
          {filtered && (
            <Link href="/" className="btn text-slate-500 hover:text-slate-800">Clear</Link>
          )}
        </form>

        {tasks.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            No tasks match. <Link href="/tasks/new" className="text-indigo-600 hover:underline">Add one</Link>.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Task</th>
                  <th className="px-4 py-2 font-medium">Due</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="hidden px-4 py-2 font-medium md:table-cell">Repeats</th>
                  <th className="hidden px-4 py-2 font-medium lg:table-cell">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tasks.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/tasks/${t.id}`} className="font-medium text-slate-900 hover:text-indigo-700">
                        {t.title}
                      </Link>
                      <div className="mt-0.5 text-xs text-slate-500">
                        {[t.category, t.vendor, t.asset].filter(Boolean).join(" · ")}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top"><DueDate task={t} /></td>
                    <td className="px-4 py-3 align-top"><StateBadge state={taskState(t, d)} /></td>
                    <td className="hidden px-4 py-3 align-top text-slate-600 md:table-cell">
                      {RECURRENCES[t.recurrence].label}
                    </td>
                    <td className="hidden px-4 py-3 align-top lg:table-cell">
                      <PriorityLabel priority={t.priority} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

const TONES = {
  red: "text-red-700",
  amber: "text-amber-700",
  indigo: "text-indigo-700",
  slate: "text-slate-900",
};

function Stat({ label, value, tone, href }: { label: string; value: number | string; tone: keyof typeof TONES; href?: string }) {
  const body = (
    <>
      <div className={`text-2xl font-semibold ${TONES[tone]}`}>{value}</div>
      <div className="mt-1 text-xs text-slate-500">{label}</div>
    </>
  );
  return href ? (
    <Link href={href} className="card block p-4 hover:border-indigo-300">{body}</Link>
  ) : (
    <div className="card p-4">{body}</div>
  );
}
