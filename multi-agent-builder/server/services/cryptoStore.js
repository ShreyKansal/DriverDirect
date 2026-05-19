import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { env } from "../config/env.js";

const ALGORITHM = "aes-256-gcm";
const ENCRYPTED_STRING_PREFIX = "enc:v1:";
const ENCRYPTED_JSON_KEY = "__enc_v1";

function deriveKey(secret) {
  if (!secret) return null;
  if (/^[0-9a-f]{64}$/i.test(secret)) {
    return Buffer.from(secret, "hex");
  }
  return createHash("sha256").update(secret, "utf8").digest();
}

const encryptionKey = deriveKey(env.encryptionSecret);

function requireEncryptionKey() {
  if (!encryptionKey) {
    throw new Error("Encryption is not configured. Set ENCRYPTION_KEY or NEXTAUTH_SECRET.");
  }
  return encryptionKey;
}

function isLegacyEncryptedString(value) {
  const parts = value.split(":");
  if (parts.length !== 3) return false;
  return parts.every((part) => /^[0-9a-f]+$/i.test(part));
}

function decryptPayload(payload) {
  const [ivHex, authTagHex, encryptedHex] = payload.split(":");
  const key = requireEncryptionKey();
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(encrypted, undefined, "utf8") + decipher.final("utf8");
}

export function encryptString(plaintext) {
  if (plaintext == null) return plaintext;

  const key = requireEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(String(plaintext), "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${ENCRYPTED_STRING_PREFIX}${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptString(value) {
  if (value == null || value === "") return value;
  if (value.startsWith("plain:")) return value.slice(6);
  if (value.startsWith(ENCRYPTED_STRING_PREFIX)) {
    return decryptPayload(value.slice(ENCRYPTED_STRING_PREFIX.length));
  }
  if (isLegacyEncryptedString(value)) {
    return decryptPayload(value);
  }
  return value;
}

export function encryptJson(value) {
  return { [ENCRYPTED_JSON_KEY]: encryptString(JSON.stringify(value ?? null)) };
}

export function decryptJson(value) {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    typeof value[ENCRYPTED_JSON_KEY] === "string"
  ) {
    return JSON.parse(decryptString(value[ENCRYPTED_JSON_KEY]));
  }
  return value;
}

export function isEncryptionConfigured() {
  return !!encryptionKey;
}
