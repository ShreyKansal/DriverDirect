import express from "express";
import { getAllProviders } from "../config/providers.js";

const router = express.Router();

router.get("/defaults", (_req, res) => {
  res.json({
    agentTypes:       ["user_input", "agent", "orchestrator", "output"],
    inputModes:       ["user_input", "previous_agent_output", "combined_context"],
    outputFormats:    ["plain_text", "markdown", "json"],
    toolPlaceholders: ["web_search", "calculator", "custom_tool"]
  });
});

router.get("/providers", (_req, res) => {
  const providers = getAllProviders().map((p) => ({
    id:          p.id,
    name:        p.name,
    description: p.description,
    keyHint:     p.keyHint,
    docsUrl:     p.docsUrl,
    models:      p.models
  }));
  res.json({ providers });
});

export default router;
