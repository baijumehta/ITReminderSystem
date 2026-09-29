// Creates the schema and (optionally) loads sample data.
//   npm run db:setup           -> create tables if missing
//   npm run db:seed            -> create tables + insert sample tasks
//   npm run db:reset           -> DROP everything, recreate, and seed
import { readFileSync, existsSync } from "node:fs";
import postgres from "postgres";

for (const f of [".env.local", ".env"]) {
  if (existsSync(f)) process.loadEnvFile(f);
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Add it to .env.local (see .env.example).");
  process.exit(1);
}

const reset = process.argv.includes("--reset");
const seed = reset || process.argv.includes("--seed");
const sql = postgres(url, { prepare: false, onnotice: () => {} });

try {
  if (reset) {
    await sql.unsafe("DROP TABLE IF EXISTS reminder_runs; DROP TABLE IF EXISTS tasks;");
    console.log("Dropped existing tables.");
  }
  await sql.unsafe(readFileSync("db/schema.sql", "utf8"));
  console.log("Schema ready.");

  if (seed) {
    const [{ count }] = await sql`SELECT count(*)::int AS count FROM tasks`;
    if (count > 0 && !reset) {
      console.log(`Skipping seed: tasks table already has ${count} rows (use db:reset to start over).`);
    } else {
      await sql.unsafe(readFileSync("db/seed.sql", "utf8"));
      const [{ count: n }] = await sql`SELECT count(*)::int AS count FROM tasks`;
      console.log(`Seeded ${n} sample tasks.`);
    }
  }
} finally {
  await sql.end();
}
