import { and, desc, eq, isNull, or } from "drizzle-orm";
import { db } from "../db/index.js";
import { projects } from "../db/schema.js";
import { decryptJson, encryptJson } from "./cryptoStore.js";

// Build the JSON payload stored in workflowJson: supports both old (single workflow)
// and new (multi-workflow) formats. Old projects in DB are migrated by the client's
// migrateProject() when loaded, so we only need to write the new format going forward.
function buildWorkflowJson(project) {
  if (project.workflows) {
    return encryptJson({
      workflows: project.workflows,
      activeWorkflowId: project.activeWorkflowId,
      settings: project.settings || null,
    });
  }

  // Backward compat: caller passed old-format project; wrap it.
  return encryptJson(project.workflow || {});
}

function parseProjectRow(row) {
  const json = decryptJson(row.workflowJson) || {};

  if (Array.isArray(json.workflows)) {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      workflows: json.workflows,
      activeWorkflowId: json.activeWorkflowId,
      settings: json.settings || undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    workflow: json,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function saveProject(project, userId) {
  const now = new Date();
  const workflowJson = buildWorkflowJson(project);
  const updateSet = {
    name: project.name || "",
    description: project.description || "",
    workflowJson,
    updatedAt: now,
  };

  if (userId) {
    updateSet.userId = userId;
  }

  await db
    .insert(projects)
    .values({
      id: project.id,
      userId: userId || null,
      name: project.name || "",
      description: project.description || "",
      workflowJson,
      createdAt: project.createdAt ? new Date(project.createdAt) : now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: projects.id,
      set: updateSet,
    });

  return { ...project, updatedAt: now.toISOString() };
}

export async function getProjects(userId) {
  if (userId) {
    // One-time migration for legacy rows created before user ownership was
    // reliably attached on the client. After claim, rows are isolated per user.
    await db.update(projects).set({ userId }).where(isNull(projects.userId));
  }

  const rows = await db
    .select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      workflowJson: projects.workflowJson,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
    })
    .from(projects)
    .where(userId ? eq(projects.userId, userId) : isNull(projects.userId))
    .orderBy(desc(projects.updatedAt));

  return rows.map(parseProjectRow);
}

export async function getProjectById(id, userId) {
  const ownershipFilter = userId
    ? or(eq(projects.userId, userId), isNull(projects.userId))
    : isNull(projects.userId);

  const [row] = await db
    .select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      workflowJson: projects.workflowJson,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
    })
    .from(projects)
    .where(and(eq(projects.id, id), ownershipFilter));

  return row ? parseProjectRow(row) : null;
}

export async function deleteProject(id, userId) {
  await db
    .delete(projects)
    .where(
      and(
        eq(projects.id, id),
        or(eq(projects.userId, userId || null), isNull(projects.userId)),
      ),
    );
}
