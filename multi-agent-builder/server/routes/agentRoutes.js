import express from "express";
import { getAllProviders } from "../config/providers.js";
import { getCustomProviders } from "../services/customProviderStore.js";

const router = express.Router();

router.get("/defaults", (_req, res) => {
  res.json({
    agentTypes:       ["user_input", "agent", "orchestrator", "output"],
    inputModes:       ["user_input", "previous_agent_output", "combined_context"],
    outputFormats:    ["plain_text", "markdown", "json"],
    toolPlaceholders: ["web_search", "calculator", "custom_tool"]
  });
});

// GET /api/agents/providers?projectId=<id>
// Returns built-in providers merged with the project's custom providers (if projectId given)
router.get("/providers", async (req, res) => {
  const { projectId } = req.query;

  const builtIn = getAllProviders().map((p) => ({
    id:          p.id,
    name:        p.name,
    description: p.description,
    keyHint:     p.keyHint,
    docsUrl:     p.docsUrl,
    models:      p.models,
    isCustom:    false
  }));

  if (!projectId) {
    return res.json({ providers: builtIn });
  }

  try {
    const custom = await getCustomProviders(projectId);
    const customFormatted = custom.map((p) => ({
      id:          p.id,
      name:        p.name,
      description: `Custom ${p.type} provider`,
      keyHint:     p.type === "local" ? "(no key needed)" : "API key",
      docsUrl:     null,
      models:      p.models,
      isCustom:    true,
      type:        p.type
    }));
    res.json({ providers: [...builtIn, ...customFormatted] });
  } catch {
    res.json({ providers: builtIn });
  }
});

export default router;
