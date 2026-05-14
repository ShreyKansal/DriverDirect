import dotenv from "dotenv";

dotenv.config();

export const env = {
  // AES-256-GCM encryption key for storing API keys in DB.
  // Must be a 64-char hex string (32 bytes). If unset, keys are stored unencrypted (dev only).
  encryptionKey: process.env.ENCRYPTION_KEY || "",

  port:       Number(process.env.PORT     || 4000),
  dbHost:     process.env.DB_HOST         || "localhost",
  dbPort:     Number(process.env.DB_PORT  || 5432),
  dbName:     process.env.DB_NAME         || "driverdirect",
  dbUser:     process.env.DB_USER         || "driverdirect",
  dbPassword: process.env.DB_PASSWORD     || "driverdirect"
};
