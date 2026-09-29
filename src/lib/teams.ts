import { formatDate, formatLongDate, relativeDays } from "./dates";
import type { Task } from "./tasks";

export function appUrl() {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}

export type ReminderGroups = { overdue: Task[]; dueSoon: Task[]; upcoming: Task[] };

export function groupForReminder(tasks: Task[]): ReminderGroups {
  return {
    overdue: tasks.filter((t) => t.days_until < 0),
    dueSoon: tasks.filter((t) => t.days_until >= 0 && t.days_until <= 7),
    upcoming: tasks.filter((t) => t.days_until > 7),
  };
}

export function summaryLine(g: ReminderGroups) {
  const parts = [];
  if (g.overdue.length) parts.push(`${g.overdue.length} overdue`);
  if (g.dueSoon.length) parts.push(`${g.dueSoon.length} due this week`);
  if (g.upcoming.length) parts.push(`${g.upcoming.length} coming up`);
  return parts.join(" · ");
}

const MAX_PER_SECTION = 15; // keeps the card well under Teams' ~28 KB limit

function taskBlock(t: Task, base: string) {
  const meta = [`Due ${formatDate(t.due_date)} (${relativeDays(t.days_until)})`, t.vendor, t.asset]
    .filter(Boolean)
    .join(" · ");
  return {
    type: "Container",
    spacing: "Small",
    selectAction: { type: "Action.OpenUrl", url: `${base}/tasks/${t.id}` },
    items: [
      {
        type: "TextBlock",
        text: `${t.priority === "critical" ? "🔴 " : t.priority === "high" ? "🟠 " : ""}**${t.title}**`,
        wrap: true,
      },
      { type: "TextBlock", text: meta, wrap: true, isSubtle: true, size: "Small", spacing: "None" },
    ],
  };
}

function section(title: string, color: string, tasks: Task[], base: string) {
  if (!tasks.length) return [];
  const shown = tasks.slice(0, MAX_PER_SECTION);
  return [
    {
      type: "TextBlock",
      text: `${title} (${tasks.length})`,
      weight: "Bolder",
      color,
      spacing: "Large",
      separator: true,
    },
    ...shown.map((t) => taskBlock(t, base)),
    ...(tasks.length > shown.length
      ? [{ type: "TextBlock", text: `…and ${tasks.length - shown.length} more`, isSubtle: true, size: "Small" }]
      : []),
  ];
}

/** Adaptive Card (v1.4) for the daily reminder message. */
export function buildReminderCard(tasks: Task[], runDate: string) {
  const base = appUrl();
  const g = groupForReminder(tasks);
  return {
    $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
    type: "AdaptiveCard",
    version: "1.4",
    msteams: { width: "Full" },
    body: [
      { type: "TextBlock", text: "IT Reminders", size: "Large", weight: "Bolder" },
      {
        type: "TextBlock",
        text: `${formatLongDate(runDate)} — ${summaryLine(g)}`,
        wrap: true,
        isSubtle: true,
        spacing: "None",
      },
      ...section("⚠️ Overdue", "Attention", g.overdue, base),
      ...section("Due this week", "Warning", g.dueSoon, base),
      ...section("Coming up", "Default", g.upcoming, base),
      {
        type: "TextBlock",
        text: "You'll get this reminder every day until each task is closed out.",
        wrap: true,
        isSubtle: true,
        size: "Small",
        spacing: "Large",
      },
    ],
    actions: [{ type: "Action.OpenUrl", title: "Open reminder list", url: base }],
  };
}

/**
 * Posts to a Teams "Workflows" webhook (Power Automate "When a Teams webhook
 * request is received" → "Post card in a chat or channel"). The same payload
 * also works with legacy Office 365 Incoming Webhook connectors.
 */
export async function sendToTeams(card: object): Promise<{ ok: boolean; detail: string }> {
  const url = process.env.TEAMS_WEBHOOK_URL;
  if (!url) return { ok: false, detail: "TEAMS_WEBHOOK_URL is not set — dry run only, nothing was sent." };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "message",
      attachments: [{ contentType: "application/vnd.microsoft.card.adaptive", contentUrl: null, content: card }],
    }),
  });
  if (res.ok) return { ok: true, detail: `Delivered to Teams (HTTP ${res.status}).` };
  const body = (await res.text()).slice(0, 300);
  return { ok: false, detail: `Teams webhook returned HTTP ${res.status}: ${body}` };
}
