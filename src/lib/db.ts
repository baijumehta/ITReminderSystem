import postgres from "postgres";

// One client per server instance, created lazily so builds don't need a database.
// `prepare: false` keeps this compatible with Neon's pooled (PgBouncer) connection
// string, which is the one to use on Vercel.
const globalForDb = globalThis as unknown as { sql?: postgres.Sql };

export function db(): postgres.Sql {
  if (!globalForDb.sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set. See .env.example.");
    globalForDb.sql = postgres(url, {
      prepare: false,
      max: Number(process.env.DB_POOL_MAX) || 5,
      idle_timeout: 20,
      onnotice: () => {},
    });
  }
  return globalForDb.sql;
}
