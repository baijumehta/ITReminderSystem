import Link from "next/link";
import { sendRemindersNowAction } from "@/app/actions";
import { formatDate, formatLongDate, relativeDays, today } from "@/lib/dates";
import { recentRuns, tasksNeedingReminder, type Task } from "@/lib/tasks";
import { buildReminderCard, groupForReminder, summaryLine } from "@/lib/teams";

const SENT_MESSAGES: Record<string, { tone: string; text: string }> = {
  sent: { tone: "bg-emerald-50 text-emerald-900 ring-emerald-200", text: "Reminder sent to Teams." },
  "nothing-due": { tone: "bg-slate-100 text-slate-700 ring-slate-200", text: "Nothing is due, so no message was sent." },
  "not-delivered": { tone: "bg-amber-50 text-amber-900 ring-amber-200", text: "The message was not delivered — see the run log below." },
};

export default async function PreviewPage({ searchParams }: PageProps<"/preview">) {
  const sp = await searchParams;
  const d = today();
  const [tasks, runs] = await Promise.all([tasksNeedingReminder(d), recentRuns(8)]);
  const g = groupForReminder(tasks);
  const configured = Boolean(process.env.TEAMS_WEBHOOK_URL);
  const sent = SENT_MESSAGES[String(sp.sent)];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Today&apos;s Teams reminder</h1>
          <p className="text-sm text-slate-500">
            This is what gets posted to Teams each weekday morning. A task shows up here every day from its
            &ldquo;start reminding&rdquo; date until it&apos;s marked complete.
          </p>
        </div>

        {sent && <p className={`rounded-md px-4 py-2 text-sm ring-1 ring-inset ${sent.tone}`}>{sent.text}</p>}

        {/* Teams-style rendering of the Adaptive Card */}
        <div className="rounded-lg bg-[#f5f5f5] p-4">
          <div className="flex gap-3">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-indigo-600 text-sm font-semibold text-white">IT</div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">IT Reminders</span> · Workflows
              </div>
              <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-lg font-bold text-slate-900">IT Reminders</div>
                <div className="text-sm text-slate-500">
                  {formatLongDate(d)} — {tasks.length ? summaryLine(g) : "nothing due"}
                </div>
                <CardSection title="⚠️ Overdue" color="text-red-700" tasks={g.overdue} />
                <CardSection title="Due this week" color="text-amber-700" tasks={g.dueSoon} />
                <CardSection title="Coming up" color="text-slate-900" tasks={g.upcoming} />
                <p className="mt-4 text-xs text-slate-500">
                  You&apos;ll get this reminder every day until each task is closed out.
                </p>
                <div className="mt-3 border-t border-slate-100 pt-3">
                  <span className="inline-block rounded border border-slate-300 px-3 py-1 text-sm font-medium text-slate-700">
                    Open reminder list
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <details className="card p-4 text-sm">
          <summary className="cursor-pointer font-medium text-slate-700">Adaptive Card JSON</summary>
          <pre className="mt-3 max-h-96 overflow-auto rounded bg-slate-900 p-3 text-xs text-slate-100">
            {JSON.stringify(buildReminderCard(tasks, d), null, 2)}
          </pre>
        </details>
      </div>

      <aside className="space-y-4">
        <div className="card space-y-3 p-4">
          <h2 className="font-semibold text-slate-900">Send now</h2>
          <p className="text-sm text-slate-600">
            {configured ? (
              "Teams webhook is configured. The daily job runs automatically each weekday at 13:00 UTC (9 AM EDT / 8 AM EST)."
            ) : (
              <>
                <span className="font-medium text-amber-700">No Teams webhook configured</span> — sends are dry runs.
                Set <code className="rounded bg-slate-100 px-1">TEAMS_WEBHOOK_URL</code> to deliver for real.
              </>
            )}
          </p>
          <form action={sendRemindersNowAction}>
            <button className="btn btn-primary w-full" disabled={!tasks.length}>
              Send today&apos;s reminder to Teams
            </button>
          </form>
        </div>

        <div className="card p-4">
          <h2 className="font-semibold text-slate-900">Recent runs</h2>
          {runs.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No reminders sent yet.</p>
          ) : (
            <ul className="mt-2 divide-y divide-slate-100 text-sm">
              {runs.map((r) => (
                <li key={r.id} className="py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-slate-800">
                      {formatDate(r.run_on)} <span className="font-normal text-slate-400">· {r.trigger}</span>
                    </span>
                    <span className={r.delivered ? "text-emerald-700" : "text-amber-700"}>
                      {r.delivered ? "✓" : "✕"} {r.task_count} tasks
                    </span>
                  </div>
                  {r.detail && <div className="text-xs text-slate-500">{r.detail}</div>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}

function CardSection({ title, color, tasks }: { title: string; color: string; tasks: Task[] }) {
  if (!tasks.length) return null;
  return (
    <div className="mt-4 border-t border-slate-200 pt-3">
      <div className={`font-semibold ${color}`}>{title} ({tasks.length})</div>
      <ul className="mt-1 space-y-2">
        {tasks.map((t) => (
          <li key={t.id}>
            <Link href={`/tasks/${t.id}`} className="text-sm font-semibold text-slate-900 hover:underline">
              {t.priority === "critical" ? "🔴 " : t.priority === "high" ? "🟠 " : ""}
              {t.title}
            </Link>
            <div className="text-xs text-slate-500">
              {[`Due ${formatDate(t.due_date)} (${relativeDays(t.days_until)})`, t.vendor, t.asset].filter(Boolean).join(" · ")}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
