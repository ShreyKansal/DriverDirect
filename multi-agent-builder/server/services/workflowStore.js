import { nanoid } from "nanoid";
import { query } from "../db/index.js";

export async function saveWorkflow(workflow) {
  const now = new Date().toISOString();
  const normalized = {
    ...workflow,
    id:        workflow.id || `workflow_${nanoid(8)}`,
    createdAt: workflow.createdAt || now,
    updatedAt: now
  };

  await query(
    `INSERT INTO saved_workflows (id, name, workflow_json, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (id) DO UPDATE SET
       name          = EXCLUDED.name,
       workflow_json = EXCLUDED.workflow_json,
       updated_at    = EXCLUDED.updated_at`,
    [normalized.id, normalized.name || "", normalized, normalized.createdAt, normalized.updatedAt]
  );

  return normalized;
}

export async function getWorkflows() {
  const { rows } = await query(
    `SELECT workflow_json FROM saved_workflows ORDER BY updated_at DESC`
  );
  return rows.map((r) => r.workflow_json);
}

export async function getWorkflowById(id) {
  const { rows } = await query(
    `SELECT workflow_json FROM saved_workflows WHERE id = $1`,
    [id]
  );
  return rows[0]?.workflow_json || null;
}
