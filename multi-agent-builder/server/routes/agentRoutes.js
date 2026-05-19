import express from "express";
import { getAllProviders } from "../config/providers.js";
import { getCustomProviders } from "../services/customProviderStore.js";
import { getProjectById } from "../services/projectStore.js";
import { getRequestUserId } from "./routeContext.js";

const router = express.Router();

router.get("/defaults", (_req, res) => {
  res.json({
    agentTypes: ["user_input", "agent", "orchestrator", "output"],
    inputModes: ["user_input", "previous_agent_output", "combined_context"],
    outputFormats: ["plain_text", "markdown", "json"],
    toolPlaceholders: ["web_search", "calculator", "custom_tool"],
  });
});

router.get("/providers", async (req, res) => {
  const rawProjectId = req.query.projectId;
  const projectId = typeof rawProjectId === "string" ? rawProjectId : null;

  const builtIn = getAllProviders().map((provider) => ({
    id: provider.id,
    name: provider.name,
    description: provider.description,
    keyHint: provider.keyHint,
    docsUrl: provider.docsUrl,
    models: provider.models,
    isCustom: false,
  }));

  if (!projectId) {
    return res.json({ providers: builtIn });
  }

  try {
    const project = await getProjectById(projectId, getRequestUserId(req));
    if (!project) {
      return res.json({ providers: builtIn });
    }

    const custom = await getCustomProviders(project.id);
    const customFormatted = custom.map((provider) => ({
      id: provider.id,
      name: provider.name,
      description: `Custom ${provider.type} provider`,
      keyHint: provider.type === "local" ? "(no key needed)" : "API key",
      docsUrl: null,
      models: provider.models,
      isCustom: true,
      type: provider.type,
    }));

    res.json({ providers: [...builtIn, ...customFormatted] });
  } catch {
    res.json({ providers: builtIn });
  }
});

export default router;
