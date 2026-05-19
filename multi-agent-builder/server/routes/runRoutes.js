import express from "express";
import { executeWorkflow } from "../flows/graphExecutor.js";
import { validateWorkflow } from "../flows/graphValidator.js";
import { getProjectById } from "../services/projectStore.js";
import { getRequestUserId } from "./routeContext.js";

const router = express.Router();

async function buildExecutionInput(req, res) {
  const { workflow, userTask } = req.body;
  const projectId = typeof req.body?.projectId === "string" ? req.body.projectId : null;
  const userId = getRequestUserId(req);

  if (projectId) {
    const project = await getProjectById(projectId, userId);
    if (!project) {
      res.status(404).json({ status: "error", message: "Project not found." });
      return null;
    }
  }

  return { workflow, userTask, projectId, userId };
}

router.post("/", async (req, res) => {
  const acceptsSSE = req.headers.accept?.includes("text/event-stream");
  const executionInput = await buildExecutionInput(req, res);
  if (!executionInput) return;

  const { workflow, userTask } = executionInput;

  if (!acceptsSSE) {
    try {
      const trace = await executeWorkflow(executionInput);
      res.json({ status: trace.status, trace, finalOutput: trace.finalOutput });
    } catch (error) {
      res.status(error.validation ? 400 : 500).json({
        status: "error",
        message: error.message,
        validation: error.validation,
        trace: error.trace,
      });
    }
    return;
  }

  const validation = validateWorkflow(workflow, { requireTask: true, userTask });
  if (!validation.valid) {
    return res.status(400).json({ status: "error", message: validation.errors.join(" "), validation });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  function emit(event) {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  }

  try {
    const trace = await executeWorkflow({ ...executionInput, onEvent: emit });
    emit({ type: "workflow_complete", trace, finalOutput: trace.finalOutput, status: "completed" });
  } catch (error) {
    emit({ type: "workflow_error", message: error.message, trace: error.trace, validation: error.validation });
  } finally {
    res.end();
  }
});

export default router;
