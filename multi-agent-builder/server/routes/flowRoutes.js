import express from "express";
import { saveWorkflow, getWorkflows, getWorkflowById } from "../services/workflowStore.js";
import { validateWorkflow } from "../flows/graphValidator.js";
import { generateMermaid } from "../flows/mermaidGenerator.js";
import { parseMermaid } from "../flows/mermaidParser.js";

const router = express.Router();

router.post("/", async (req, res, next) => {
  try {
    if (!req.body || !req.body.workflow) {
      return res.status(400).json({ status: "error", message: "Missing workflow." });
    }
    const workflow = await saveWorkflow(req.body.workflow);
    res.json({ status: "saved", workflow });
  } catch (error) {
    next(error);
  }
});

router.get("/", async (_req, res, next) => {
  try {
    res.json({ workflows: await getWorkflows() });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const workflow = await getWorkflowById(req.params.id);
    if (!workflow) return res.status(404).json({ status: "error", message: "Workflow not found." });
    res.json({ workflow });
  } catch (error) {
    next(error);
  }
});

router.post("/validate", (req, res) => {
  const result = validateWorkflow(req.body.workflow, {
    requireTask: Boolean(req.body.requireTask),
    userTask: req.body.userTask
  });
  res.status(result.valid ? 200 : 400).json(result);
});

router.post("/mermaid", (req, res) => {
  const mermaid = generateMermaid(req.body.workflow);
  res.json({ mermaid });
});

router.post("/mermaid/parse", (req, res) => {
  try {
    const graph = parseMermaid(req.body.mermaid || "");
    res.json({ status: "parsed", graph });
  } catch (error) {
    res.status(400).json({ status: "error", message: error.message });
  }
});

export default router;
