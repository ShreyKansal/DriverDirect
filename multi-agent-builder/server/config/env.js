import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../..");

// Load shared app env first, then client env for NEXTAUTH_SECRET fallback, then cwd env.
dotenv.config({ path: path.join(rootDir, ".env"), override: false });
dotenv.config({ path: path.join(rootDir, "client", ".env.local"), override: false });
dotenv.config({ override: false });

export const env = {
  // Prefer an explicit server-side encryption key. Fall back to NEXTAUTH_SECRET so
  // encrypted settings still work in local environments without extra setup.
  encryptionKey: process.env.ENCRYPTION_KEY || "",
  encryptionSecret: process.env.ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET || "",

  port:       Number(process.env.PORT     || 4000),
  dbHost:     process.env.DB_HOST         || "localhost",
  dbPort:     Number(process.env.DB_PORT  || 5432),
  dbName:     process.env.DB_NAME         || "driverdirect",
  dbUser:     process.env.DB_USER         || "driverdirect",
  dbPassword: process.env.DB_PASSWORD     || "driverdirect"
};
