import express from "express";
import { executeWorkflow } from "../flows/graphExecutor.js";
import { validateWorkflow } from "../flows/graphValidator.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { workflow, userTask } = req.body;
  const acceptsSSE = req.headers.accept?.includes("text/event-stream");

  if (!acceptsSSE) {
    // Fallback: original blocking JSON response
    try {
      const trace = await executeWorkflow({ workflow, userTask });
      res.json({ status: trace.status, trace, finalOutput: trace.finalOutput });
    } catch (error) {
      res.status(error.validation ? 400 : 500).json({
        status: "error",
        message: error.message,
        validation: error.validation,
        trace: error.trace
      });
    }
    return;
  }

  // Validate before opening the SSE stream so errors come back as proper HTTP codes
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
    const trace = await executeWorkflow({ workflow, userTask, onEvent: emit });
    emit({ type: "workflow_complete", trace, finalOutput: trace.finalOutput, status: "completed" });
  } catch (error) {
    emit({ type: "workflow_error", message: error.message, trace: error.trace, validation: error.validation });
  } finally {
    res.end();
  }
});

export default router;
