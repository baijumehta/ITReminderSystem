import { today } from "./dates";
import { buildReminderCard, sendToTeams } from "./teams";
import { deliveredToday, markReminded, recordRun, tasksNeedingReminder } from "./tasks";

export type RunResult = {
  status: "sent" | "skipped" | "nothing-due" | "not-delivered";
  taskCount: number;
  detail: string;
};

/**
 * Sends one consolidated Teams message listing every open task inside its
 * reminder window. Runs daily from Vercel Cron; can also be triggered manually.
 */
export async function runReminders(trigger: "cron" | "manual"): Promise<RunResult> {
  const d = today();

  // Cron retries shouldn't double-post. Manual sends always go through.
  if (trigger === "cron" && (await deliveredToday(d))) {
    return { status: "skipped", taskCount: 0, detail: "Already delivered today." };
  }

  const tasks = await tasksNeedingReminder(d);
  if (!tasks.length) {
    const detail = "No open tasks in their reminder window.";
    await recordRun({ run_on: d, trigger, task_count: 0, delivered: true, detail });
    return { status: "nothing-due", taskCount: 0, detail };
  }

  const result = await sendToTeams(buildReminderCard(tasks, d));
  await recordRun({ run_on: d, trigger, task_count: tasks.length, delivered: result.ok, detail: result.detail });
  if (result.ok) await markReminded(tasks.map((t) => t.id), d);

  return { status: result.ok ? "sent" : "not-delivered", taskCount: tasks.length, detail: result.detail };
}
