// Copies settings from .env.local to the linked Vercel project (Production + Preview).
//   npm run env:push
// Values are piped to the Vercel CLI over stdin and never printed.
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { parseEnv } from "node:util";

// Local-only settings that must not be copied to Vercel.
const SKIP = new Set(["APP_URL", "DB_POOL_MAX"]);
const SENSITIVE = new Set(["DATABASE_URL", "CRON_SECRET", "APP_PASSWORD", "TEAMS_WEBHOOK_URL"]);
const TARGETS = ["production", "preview"];

const vars = Object.entries(parseEnv(readFileSync(".env.local", "utf8"))).filter(
  ([name, value]) => value && !SKIP.has(name) && !name.startsWith("VERCEL_"),
);

if (!vars.length) {
  console.error("Nothing to push: .env.local has no values set.");
  process.exit(1);
}

let failed = 0;
for (const [name, value] of vars) {
  for (const target of TARGETS) {
    const args = ["env", "add", name, target, "--force", "--yes"];
    if (SENSITIVE.has(name)) args.push("--sensitive");
    const res = spawnSync("vercel", args, { input: value, shell: true, encoding: "utf8" });
    if (res.status === 0) {
      console.log(`✓ ${name} → ${target}`);
    } else {
      failed++;
      const err = `${res.stderr ?? ""}`.split("\n").filter((l) => /error/i.test(l)).slice(0, 2).join(" ");
      console.log(`✗ ${name} → ${target}  ${err}`);
    }
  }
}

console.log(failed ? `\n${failed} failed.` : "\nDone. Redeploy for the changes to take effect: vercel --prod");
process.exit(failed ? 1 : 0);
