import express from "express";
import {
  createCustomProvider,
  getCustomProviders,
  getCustomProvider,
  updateCustomProvider,
  deleteCustomProvider
} from "../services/customProviderStore.js";
import { setProjectKey, deleteProjectKey } from "../services/keyStore.js";
import { CustomOpenAICompatModel, CustomHTTPModel } from "../services/llmProviders/customModel.js";

const router = express.Router();

// GET /api/projects/:projectId/custom-providers
router.get("/:projectId/custom-providers", async (req, res) => {
  try {
    const providers = await getCustomProviders(req.params.projectId);
    res.json({ providers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/projects/:projectId/custom-providers
router.post("/:projectId/custom-providers", async (req, res) => {
  const { projectId } = req.params;
  const { name, type, baseUrl, authHeaderName, models, requestTemplate, responsePath, apiKey } = req.body;

  if (!name?.trim())    return res.status(400).json({ error: "name is required" });
  if (!type)            return res.status(400).json({ error: "type is required" });
  if (!baseUrl?.trim()) return res.status(400).json({ error: "baseUrl is required" });

  const validTypes = ["openai-compat", "local", "custom-http"];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: `type must be one of: ${validTypes.join(", ")}` });
  }

  try {
    const provider = await createCustomProvider(projectId, { name: name.trim(), type, baseUrl: baseUrl.trim(), authHeaderName, models, requestTemplate, responsePath });
    // Persist API key if provided
    if (apiKey?.trim()) {
      await setProjectKey(projectId, provider.id, apiKey.trim());
    }
    res.status(201).json({ provider });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/projects/:projectId/custom-providers/:customId
router.put("/:projectId/custom-providers/:customId", async (req, res) => {
  const { projectId, customId } = req.params;
  const { name, type, baseUrl, authHeaderName, models, requestTemplate, responsePath, apiKey } = req.body;

  if (!name?.trim())    return res.status(400).json({ error: "name is required" });
  if (!type)            return res.status(400).json({ error: "type is required" });
  if (!baseUrl?.trim()) return res.status(400).json({ error: "baseUrl is required" });

  try {
    const provider = await updateCustomProvider(projectId, customId, { name: name.trim(), type, baseUrl: baseUrl.trim(), authHeaderName, models, requestTemplate, responsePath });
    if (!provider) return res.status(404).json({ error: "Custom provider not found" });
    if (apiKey?.trim()) {
      await setProjectKey(projectId, provider.id, apiKey.trim());
    }
    res.json({ provider });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/projects/:projectId/custom-providers/:customId
router.delete("/:projectId/custom-providers/:customId", async (req, res) => {
  const { projectId, customId } = req.params;
  try {
    // Remove API key first (ignore errors — key may not exist)
    await deleteProjectKey(projectId, customId).catch(() => {});
    await deleteCustomProvider(projectId, customId);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/projects/:projectId/custom-providers/:customId/test
router.post("/:projectId/custom-providers/:customId/test", async (req, res) => {
  const { projectId, customId } = req.params;
  const { apiKey } = req.body;

  try {
    const provider = await getCustomProvider(projectId, customId);
    if (!provider) return res.status(404).json({ error: "Custom provider not found" });

    const testMessages = [{ role: "user", content: "Hi" }];
    const model = _buildModel(provider, apiKey?.trim() || "");
    await model.invoke(testMessages);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// POST /api/projects/:projectId/custom-providers/test-config (test before saving)
router.post("/:projectId/custom-providers/test-config", async (req, res) => {
  const { type, baseUrl, authHeaderName, requestTemplate, responsePath, apiKey } = req.body;
  if (!baseUrl?.trim()) return res.status(400).json({ error: "baseUrl is required" });

  try {
    const provider = { type, baseUrl: baseUrl.trim(), authHeaderName, requestTemplate, responsePath };
    const model = _buildModel(provider, apiKey?.trim() || "");
    await model.invoke([{ role: "user", content: "Hi" }]);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// GET /api/projects/:projectId/custom-providers/discover-models
// Tries to call /v1/models on a local/openai-compat provider to auto-discover models
router.get("/:projectId/custom-providers/discover-models", async (req, res) => {
  const { baseUrl, apiKey } = req.query;
  if (!baseUrl) return res.status(400).json({ error: "baseUrl is required" });

  try {
    const url = baseUrl.replace(/\/+$/, "") + "/v1/models";
    const headers = {};
    if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
    const response = await fetch(url, { headers });
    if (!response.ok) {
      const text = await response.text().catch(() => response.statusText);
      return res.status(400).json({ ok: false, error: `${response.status}: ${text}` });
    }
    const json = await response.json();
    const models = (json.data || json.models || []).map((m) => ({
      id:   m.id || m.name || String(m),
      name: m.name || m.id || String(m)
    }));
    res.json({ ok: true, models });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

function _buildModel(provider, apiKey) {
  if (provider.type === "custom-http") {
    return new CustomHTTPModel({
      apiKey,
      model:           provider.models?.[0]?.id || "test",
      temperature:     0,
      maxTokens:       8,
      baseURL:         provider.baseUrl,
      authHeaderName:  provider.authHeaderName,
      requestTemplate: provider.requestTemplate,
      responsePath:    provider.responsePath
    });
  }
  return new CustomOpenAICompatModel({
    apiKey,
    model:       provider.models?.[0]?.id || "test",
    temperature: 0,
    maxTokens:   8,
    baseURL:     provider.baseUrl
  });
}

export default router;
