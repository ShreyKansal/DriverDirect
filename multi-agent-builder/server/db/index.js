import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { env } from "../config/env.js";
import * as schema from "./schema.js";

export const pool = new pg.Pool({
  host:     env.dbHost,
  port:     env.dbPort,
  database: env.dbName,
  user:     env.dbUser,
  password: env.dbPassword
});

// Raw query helper — kept for migrate.js which runs plain SQL DDL
export async function query(text, params) {
  return pool.query(text, params);
}

// Drizzle ORM instance — used by all service files
export const db = drizzle(pool, { schema });

export default pool;
