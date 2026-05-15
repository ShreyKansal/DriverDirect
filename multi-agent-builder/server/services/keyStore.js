import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { and, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { projectApiKeys } from "../db/schema.js";
import { env } from "../config/env.js";

const ALGORITHM = "aes-256-gcm";

function encrypt(plaintext) {
  if (!env.encryptionKey) {
    if (!_warnedOnce) {
      console.warn("[keyStore] ENCRYPTION_KEY not set — API keys stored unencrypted. Set ENCRYPTION_KEY in .env for production.");
      _warnedOnce = true;
    }
    return "plain:" + plaintext;
  }
  const key = Buffer.from(env.encryptionKey, "hex");
  const iv  = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString("hex"), authTag.toString("hex"), encrypted.toString("hex")].join(":");
}

function decrypt(stored) {
  if (stored.startsWith("plain:")) return stored.slice(6);
  const [ivHex, authTagHex, encryptedHex] = stored.split(":");
  const key = Buffer.from(env.encryptionKey, "hex");
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(encrypted) + decipher.final("utf8");
}

let _warnedOnce = false;

export async function setProjectKey(projectId, providerId, apiKey) {
  const encryptedKey = encrypt(apiKey);
  const now = new Date();

  await db
    .insert(projectApiKeys)
    .values({ projectId, providerId, encryptedKey, createdAt: now, updatedAt: now })
    .onConflictDoUpdate({
      target: [projectApiKeys.projectId, projectApiKeys.providerId],
      set: { encryptedKey, updatedAt: now }
    });
}

export async function deleteProjectKey(projectId, providerId) {
  await db
    .delete(projectApiKeys)
    .where(
      and(
        eq(projectApiKeys.projectId, projectId),
        eq(projectApiKeys.providerId, providerId)
      )
    );
}

// Returns { providerId → decryptedKey } for all configured providers in a project
export async function getProjectKeys(projectId) {
  const rows = await db
    .select({ providerId: projectApiKeys.providerId, encryptedKey: projectApiKeys.encryptedKey })
    .from(projectApiKeys)
    .where(eq(projectApiKeys.projectId, projectId));

  const keys = {};
  for (const row of rows) {
    try {
      keys[row.providerId] = decrypt(row.encryptedKey);
    } catch {
      // Skip corrupted / invalid key entries
    }
  }
  return keys;
}

// Returns list of configured provider IDs for a project (with masked key previews)
export async function getProjectKeyStatus(projectId) {
  const rows = await db
    .select({
      providerId:   projectApiKeys.providerId,
      encryptedKey: projectApiKeys.encryptedKey,
      updatedAt:    projectApiKeys.updatedAt
    })
    .from(projectApiKeys)
    .where(eq(projectApiKeys.projectId, projectId));

  return rows.map((row) => {
    let preview = "";
    try {
      const raw = decrypt(row.encryptedKey);
      preview = raw.length > 8 ? raw.slice(0, 6) + "••••••••" : "••••••••";
    } catch {
      preview = "••••••••";
    }
    return { providerId: row.providerId, preview, updatedAt: row.updatedAt };
  });
}

export function resolveKey(projectKeys, providerId) {
  return projectKeys[providerId] || "";
}
