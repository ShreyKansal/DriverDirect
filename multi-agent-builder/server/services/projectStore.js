import { query } from "../db/index.js";

export async function saveProject(project, userId) {
  const now = new Date().toISOString();

  await query(
    `INSERT INTO projects (id, user_id, name, description, workflow_json, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (id) DO UPDATE SET
       user_id       = EXCLUDED.user_id,
       name          = EXCLUDED.name,
       description   = EXCLUDED.description,
       workflow_json = EXCLUDED.workflow_json,
       updated_at    = EXCLUDED.updated_at`,
    [
      project.id,
      userId       || null,
      project.name        || "",
      project.description || "",
      project.workflow    || {},
      project.createdAt   || now,
      now
    ]
  );

  return { ...project, updatedAt: now };
}

export async function getProjects(userId) {
  const { rows } = await query(
    `SELECT
       id,
       name,
       description,
       workflow_json  AS workflow,
       created_at     AS "createdAt",
       updated_at     AS "updatedAt"
     FROM projects
     WHERE user_id = $1
     ORDER BY updated_at DESC`,
    [userId]
  );
  return rows;
}

export async function getProjectById(id) {
  const { rows } = await query(
    `SELECT
       id,
       name,
       description,
       workflow_json  AS workflow,
       created_at     AS "createdAt",
       updated_at     AS "updatedAt"
     FROM projects
     WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

export async function deleteProject(id, userId) {
  await query(
    `DELETE FROM projects WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)`,
    [id, userId || null]
  );
}
