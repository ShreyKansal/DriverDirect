import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { query } from "../db/index.js";
import { env } from "../config/env.js";

const ALGORITHM = "aes-256-gcm";

function encrypt(plaintext) {
  if (!env.encryptionKey) {
    // No encryption key set — store as-is with a dev-mode prefix
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
  await query(
    `INSERT INTO project_api_keys (project_id, provider_id, encrypted_key, updated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (project_id, provider_id)
     DO UPDATE SET encrypted_key = $3, updated_at = NOW()`,
    [projectId, providerId, encryptedKey]
  );
}

export async function deleteProjectKey(projectId, providerId) {
  await query(
    `DELETE FROM project_api_keys WHERE project_id = $1 AND provider_id = $2`,
    [projectId, providerId]
  );
}

// Returns { providerId → decryptedKey } for all configured providers in a project
export async function getProjectKeys(projectId) {
  const result = await query(
    `SELECT provider_id, encrypted_key FROM project_api_keys WHERE project_id = $1`,
    [projectId]
  );
  const keys = {};
  for (const row of result.rows) {
    try {
      keys[row.provider_id] = decrypt(row.encrypted_key);
    } catch {
      // Skip corrupted/invalid key entries
    }
  }
  return keys;
}

// Returns list of configured provider IDs for a project (with masked key preview)
export async function getProjectKeyStatus(projectId) {
  const result = await query(
    `SELECT provider_id, encrypted_key, updated_at FROM project_api_keys WHERE project_id = $1`,
    [projectId]
  );
  return result.rows.map((row) => {
    let preview = "";
    try {
      const raw = decrypt(row.encrypted_key);
      preview = raw.length > 8 ? raw.slice(0, 6) + "••••••••" : "••••••••";
    } catch {
      preview = "••••••••";
    }
    return { providerId: row.provider_id, preview, updatedAt: row.updated_at };
  });
}

export function resolveKey(projectKeys, providerId) {
  return projectKeys[providerId] || "";
}
