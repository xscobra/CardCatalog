import { Pool } from "pg";
// CHANGE #1: We need to import the Drizzle adapter for 'pg' (node-postgres), not neon-serverless.
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import * as schema from "@shared/schema";

// CHANGE #2: These lines were for the old Neon driver and must be removed.
// import ws from "ws";
// neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // CHANGE #3: This SSL setting is often required to connect to cloud databases like Render's.
  ssl: {
    rejectUnauthorized: false,
  },
  // Your other settings are great!
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

// This now correctly uses the Pool from 'pg' with the adapter for 'pg'.
export const db = drizzle(pool, { schema });
export { sql };
