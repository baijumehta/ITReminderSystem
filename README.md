# IT Reminder System

Track IT renewals and recurring chores (SSL certificates, firewall subscriptions,
licences, domains, patching…) and get a **daily Microsoft Teams reminder** listing
everything that's due, until each task is closed out.

**Stack:** Next.js 16 on Vercel · Postgres on Neon · Vercel Cron · Teams Workflows webhook

## How it works

- Each task has a **due date** and a **"start reminding X days before"** setting.
- Every weekday at 13:00 UTC (9 AM EDT / 8 AM EST) a Vercel Cron job calls
  `/api/cron/reminders`. It posts one Adaptive Card to Teams listing every open task
  inside its reminder window, grouped as **Overdue**, **Due this week** and **Coming up**.
- A task keeps appearing every day until someone marks it **complete**.
- **Recurring** tasks (monthly, quarterly, yearly…) create their next occurrence
  automatically when completed, so renewals never fall off the list. Completion
  notes are kept as history on each occurrence.
- **Snooze** pauses the reminder for 1/3/7 days (overdue tasks are always included).
- The **Teams message** page previews exactly what will be posted and has a
  "Send now" button for demos.

## Local setup

```bash
npm install
cp .env.example .env.local   # then fill in DATABASE_URL etc.
npm run db:seed              # create tables + load sample IT tasks
npm run dev                  # http://localhost:3000
```

| Script | What it does |
| --- | --- |
| `npm run db:setup` | Create tables if they don't exist |
| `npm run db:seed` | Create tables and load sample tasks (only if the table is empty) |
| `npm run db:reset` | **Drop all data**, recreate, and reseed |

Sample due dates are relative to the day you seed, so re-run `db:reset` right before
a demo to get a fresh mix of overdue / due-soon / future tasks.

## Environment variables

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | Neon connection string. Use the **pooled** one (`-pooler` in the host) on Vercel. |
| `CRON_SECRET` | yes | Long random string. Vercel Cron sends it as a Bearer token automatically. |
| `TEAMS_WEBHOOK_URL` | for delivery | Teams Workflows webhook URL. Without it, sends are dry runs. |
| `APP_PASSWORD` | optional | Puts the whole site behind a browser password prompt until Entra ID is added. |
| `APP_URL` | optional | Base URL for links in the Teams card. Defaults to the Vercel production domain. |
| `APP_TIMEZONE` | optional | Decides what "today" is. Default `America/New_York`. |
| `DB_POOL_MAX` | optional | Max DB connections per instance (default 5). |

## Setting up the Teams webhook

Microsoft retired the old Office 365 "Incoming Webhook" connectors, so use **Workflows**:

1. In Teams, open the channel (or chat) that should receive reminders → **⋯** → **Workflows**.
2. Pick the template **"Post to a channel when a webhook request is received"**
   (or "Send webhook alerts to a chat" to have it DM her directly).
3. Finish the wizard and copy the generated URL.
4. Set it as `TEAMS_WEBHOOK_URL` in Vercel (and `.env.local` to test locally).
5. Open the **Teams message** page and click **Send today's reminder to Teams**.

## Deploying to Vercel

1. Import the GitHub repo in Vercel (framework preset: Next.js).
2. Add the environment variables above (Production + Preview). If you use the Neon
   integration from the Vercel marketplace, `DATABASE_URL` is added for you.
3. Deploy. The cron schedule in `vercel.json` is registered automatically on
   production deployments. Change `"schedule"` there to adjust the time
   (it's UTC; `0 13 * * *` would include weekends).
4. Run `npm run db:seed` once from your machine against the Neon database.

## Next steps (beyond the proof of concept)

- **Entra ID sign-in** – replace the `APP_PASSWORD` check in `src/proxy.ts` with
  Auth.js (Microsoft Entra ID provider) or MSAL; add an `owner` column so tasks can be
  assigned to people.
- **Per-person reminders** – send each owner their own card via a Teams bot or
  Microsoft Graph instead of one shared webhook.
- **"Mark complete" from Teams** – Adaptive Card `Action.Execute` buttons need a Teams
  bot registration; the current card links back to the app instead.
- **Email fallback** and an **audit log** of who changed what.

## Project layout

```
db/schema.sql, db/seed.sql     Database schema and sample IT tasks
scripts/db-setup.mjs           Schema/seed runner
src/lib/tasks.ts               All task queries (create, complete + recur, snooze…)
src/lib/reminders.ts           Daily reminder job
src/lib/teams.ts               Adaptive Card builder + webhook sender
src/app/api/cron/reminders     Endpoint called by Vercel Cron
src/app/                       Pages: dashboard, task detail/edit, Teams preview
src/proxy.ts                   Optional password protection
```
