import { and, asc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { customProviders } from "../db/schema.js";

export async function createCustomProvider(projectId, { name, type, baseUrl, authHeaderName, models, requestTemplate, responsePath }) {
  const [row] = await db
    .insert(customProviders)
    .values({
      projectId,
      name,
      type,
      baseUrl,
      authHeaderName: authHeaderName || "Authorization",
      models:         models || [],
      requestTemplate: requestTemplate || null,
      responsePath:    responsePath    || null
    })
    .returning();
  return row;
}

export async function getCustomProviders(projectId) {
  return db
    .select()
    .from(customProviders)
    .where(eq(customProviders.projectId, projectId))
    .orderBy(asc(customProviders.createdAt));
}

export async function getCustomProvider(projectId, customId) {
  const [row] = await db
    .select()
    .from(customProviders)
    .where(
      and(
        eq(customProviders.id, customId),
        eq(customProviders.projectId, projectId)
      )
    );
  return row || null;
}

export async function updateCustomProvider(projectId, customId, { name, type, baseUrl, authHeaderName, models, requestTemplate, responsePath }) {
  const [row] = await db
    .update(customProviders)
    .set({
      name,
      type,
      baseUrl,
      authHeaderName:  authHeaderName  || "Authorization",
      models:          models          || [],
      requestTemplate: requestTemplate || null,
      responsePath:    responsePath    || null,
      updatedAt:       new Date()
    })
    .where(
      and(
        eq(customProviders.id, customId),
        eq(customProviders.projectId, projectId)
      )
    )
    .returning();
  return row || null;
}

export async function deleteCustomProvider(projectId, customId) {
  await db
    .delete(customProviders)
    .where(
      and(
        eq(customProviders.id, customId),
        eq(customProviders.projectId, projectId)
      )
    );
}
