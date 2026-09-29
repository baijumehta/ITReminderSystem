// Dates are handled as plain "YYYY-MM-DD" strings in the business time zone so
// "today" means the same thing to the cron job, the UI and the database.

export const APP_TIMEZONE = process.env.APP_TIMEZONE || "America/New_York";

export function today(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function asUtc(date: string) {
  return new Date(`${date}T00:00:00Z`);
}

export function formatDate(date: string, opts: Intl.DateTimeFormatOptions = {}) {
  return asUtc(date).toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
    ...opts,
  });
}

export function formatLongDate(date: string) {
  return formatDate(date, { weekday: "long", month: "long" });
}

export function addDays(date: string, days: number) {
  const d = asUtc(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function relativeDays(days: number) {
  if (days === 0) return "due today";
  if (days === 1) return "due tomorrow";
  if (days === -1) return "1 day overdue";
  if (days < 0) return `${-days} days overdue`;
  return `in ${days} days`;
}
