import { and, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { projectApiKeys } from "../db/schema.js";
import { decryptString, encryptString } from "./cryptoStore.js";

const GLOBAL_SCOPE_PREFIX = "__global__:";

function globalScopeId(userId) {
  return `${GLOBAL_SCOPE_PREFIX}${userId || "anonymous"}`;
}

function maskPreview(rawKey) {
  if (!rawKey) return "********";
  return rawKey.length > 8 ? `${rawKey.slice(0, 6)}********` : "********";
}

async function getKeyRow(projectId, providerId) {
  const [row] = await db
    .select({
      providerId: projectApiKeys.providerId,
      encryptedKey: projectApiKeys.encryptedKey,
      updatedAt: projectApiKeys.updatedAt,
    })
    .from(projectApiKeys)
    .where(
      and(
        eq(projectApiKeys.projectId, projectId),
        eq(projectApiKeys.providerId, providerId),
      ),
    );

  return row || null;
}

export async function setProjectKey(projectId, providerId, apiKey) {
  const encryptedKey = encryptString(apiKey);
  const now = new Date();

  await db
    .insert(projectApiKeys)
    .values({ projectId, providerId, encryptedKey, createdAt: now, updatedAt: now })
    .onConflictDoUpdate({
      target: [projectApiKeys.projectId, projectApiKeys.providerId],
      set: { encryptedKey, updatedAt: now },
    });
}

export async function deleteProjectKey(projectId, providerId) {
  await db
    .delete(projectApiKeys)
    .where(
      and(
        eq(projectApiKeys.projectId, projectId),
        eq(projectApiKeys.providerId, providerId),
      ),
    );
}

export async function getProjectKey(projectId, providerId) {
  const row = await getKeyRow(projectId, providerId);
  if (!row) return null;

  return {
    providerId: row.providerId,
    apiKey: decryptString(row.encryptedKey),
    updatedAt: row.updatedAt,
  };
}

export async function getProjectKeys(projectId) {
  const rows = await db
    .select({ providerId: projectApiKeys.providerId, encryptedKey: projectApiKeys.encryptedKey })
    .from(projectApiKeys)
    .where(eq(projectApiKeys.projectId, projectId));

  const keys = {};
  for (const row of rows) {
    try {
      keys[row.providerId] = decryptString(row.encryptedKey);
    } catch {
      // Skip corrupted / invalid key entries.
    }
  }
  return keys;
}

export async function getProjectKeyStatus(projectId) {
  const rows = await db
    .select({
      providerId: projectApiKeys.providerId,
      encryptedKey: projectApiKeys.encryptedKey,
      updatedAt: projectApiKeys.updatedAt,
    })
    .from(projectApiKeys)
    .where(eq(projectApiKeys.projectId, projectId));

  return rows.map((row) => {
    let preview = "********";
    try {
      preview = maskPreview(decryptString(row.encryptedKey));
    } catch {
      preview = "********";
    }
    return { providerId: row.providerId, preview, updatedAt: row.updatedAt };
  });
}

export function resolveKey(projectKeys, providerId) {
  return projectKeys[providerId] || "";
}

export async function setGlobalKey(userId, providerId, apiKey) {
  return setProjectKey(globalScopeId(userId), providerId, apiKey);
}

export async function deleteGlobalKey(userId, providerId) {
  return deleteProjectKey(globalScopeId(userId), providerId);
}

export async function getGlobalKey(userId, providerId) {
  return getProjectKey(globalScopeId(userId), providerId);
}

export async function getGlobalKeys(userId) {
  return getProjectKeys(globalScopeId(userId));
}

export async function getGlobalKeyStatus(userId) {
  return getProjectKeyStatus(globalScopeId(userId));
}
