import { and, asc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { customProviders } from "../db/schema.js";
import { decryptJson, decryptString, encryptJson, encryptString } from "./cryptoStore.js";

function encryptNullable(value) {
  return value == null || value === "" ? value : encryptString(value);
}

function decryptNullable(value) {
  return value == null || value === "" ? value : decryptString(value);
}

function serializeProviderInput({
  name,
  type,
  baseUrl,
  authHeaderName,
  models,
  requestTemplate,
  responsePath,
}) {
  return {
    name,
    type,
    baseUrl: encryptString(baseUrl),
    authHeaderName: encryptString(authHeaderName || "Authorization"),
    models: encryptJson(models || []),
    requestTemplate: encryptNullable(requestTemplate || null),
    responsePath: encryptNullable(responsePath || null),
  };
}

function parseProviderRow(row) {
  if (!row) return null;

  return {
    ...row,
    baseUrl: decryptString(row.baseUrl),
    authHeaderName: decryptString(row.authHeaderName),
    models: decryptJson(row.models) || [],
    requestTemplate: decryptNullable(row.requestTemplate),
    responsePath: decryptNullable(row.responsePath),
  };
}

export async function createCustomProvider(projectId, input) {
  const [row] = await db
    .insert(customProviders)
    .values({
      projectId,
      ...serializeProviderInput(input),
    })
    .returning();

  return parseProviderRow(row);
}

export async function getCustomProviders(projectId) {
  const rows = await db
    .select()
    .from(customProviders)
    .where(eq(customProviders.projectId, projectId))
    .orderBy(asc(customProviders.createdAt));

  return rows.map(parseProviderRow);
}

export async function getCustomProvider(projectId, customId) {
  const [row] = await db
    .select()
    .from(customProviders)
    .where(
      and(
        eq(customProviders.id, customId),
        eq(customProviders.projectId, projectId),
      ),
    );

  return parseProviderRow(row || null);
}

export async function updateCustomProvider(projectId, customId, input) {
  const [row] = await db
    .update(customProviders)
    .set({
      ...serializeProviderInput(input),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(customProviders.id, customId),
        eq(customProviders.projectId, projectId),
      ),
    )
    .returning();

  return parseProviderRow(row || null);
}

export async function deleteCustomProvider(projectId, customId) {
  await db
    .delete(customProviders)
    .where(
      and(
        eq(customProviders.id, customId),
        eq(customProviders.projectId, projectId),
      ),
    );
}
