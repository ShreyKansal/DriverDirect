import { desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "../db/index.js";
import { savedWorkflows } from "../db/schema.js";
import { decryptJson, encryptJson } from "./cryptoStore.js";

export async function saveWorkflow(workflow) {
  const now = new Date();
  const normalized = {
    ...workflow,
    id: workflow.id || `workflow_${nanoid(8)}`,
    createdAt: workflow.createdAt || now.toISOString(),
    updatedAt: now.toISOString(),
  };

  await db
    .insert(savedWorkflows)
    .values({
      id: normalized.id,
      name: normalized.name || "",
      workflowJson: encryptJson(normalized),
      createdAt: new Date(normalized.createdAt),
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: savedWorkflows.id,
      set: {
        name: normalized.name || "",
        workflowJson: encryptJson(normalized),
        updatedAt: now,
      },
    });

  return normalized;
}

export async function getWorkflows() {
  const rows = await db
    .select({ workflowJson: savedWorkflows.workflowJson })
    .from(savedWorkflows)
    .orderBy(desc(savedWorkflows.updatedAt));

  return rows.map((row) => decryptJson(row.workflowJson));
}

export async function getWorkflowById(id) {
  const [row] = await db
    .select({ workflowJson: savedWorkflows.workflowJson })
    .from(savedWorkflows)
    .where(eq(savedWorkflows.id, id));

  return row ? decryptJson(row.workflowJson) : null;
}
