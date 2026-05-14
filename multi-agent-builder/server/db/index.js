import pg from "pg";
import { env } from "../config/env.js";

const pool = new pg.Pool({
  host:     env.dbHost,
  port:     env.dbPort,
  database: env.dbName,
  user:     env.dbUser,
  password: env.dbPassword
});

export async function query(text, params) {
  return pool.query(text, params);
}

export default pool;
