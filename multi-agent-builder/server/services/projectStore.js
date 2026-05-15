import { and, eq, or, isNull, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { projects } from "../db/schema.js";

export async function saveProject(project, userId) {
  const now = new Date();

  await db
    .insert(projects)
    .values({
      id:           project.id,
      userId:       userId || null,
      name:         project.name        || "",
      description:  project.description || "",
      workflowJson: project.workflow    || {},
      createdAt:    project.createdAt ? new Date(project.createdAt) : now,
      updatedAt:    now
    })
    .onConflictDoUpdate({
      target: projects.id,
      set: {
        userId:       userId || null,
        name:         project.name        || "",
        description:  project.description || "",
        workflowJson: project.workflow    || {},
        updatedAt:    now
      }
    });

  return { ...project, updatedAt: now.toISOString() };
}

export async function getProjects(userId) {
  return db
    .select({
      id:          projects.id,
      name:        projects.name,
      description: projects.description,
      workflow:    projects.workflowJson,
      createdAt:   projects.createdAt,
      updatedAt:   projects.updatedAt
    })
    .from(projects)
    .where(eq(projects.userId, userId))
    .orderBy(desc(projects.updatedAt));
}

export async function getProjectById(id) {
  const [row] = await db
    .select({
      id:          projects.id,
      name:        projects.name,
      description: projects.description,
      workflow:    projects.workflowJson,
      createdAt:   projects.createdAt,
      updatedAt:   projects.updatedAt
    })
    .from(projects)
    .where(eq(projects.id, id));

  return row || null;
}

export async function deleteProject(id, userId) {
  await db
    .delete(projects)
    .where(
      and(
        eq(projects.id, id),
        or(eq(projects.userId, userId || null), isNull(projects.userId))
      )
    );
}
