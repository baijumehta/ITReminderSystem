import { runReminders } from "@/lib/reminders";

// Called by Vercel Cron (see vercel.json). Vercel sends
// "Authorization: Bearer <CRON_SECRET>" automatically when CRON_SECRET is set.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return Response.json({ error: "CRON_SECRET is not configured" }, { status: 500 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runReminders("cron");
  return Response.json(result, { status: result.status === "not-delivered" ? 502 : 200 });
}
