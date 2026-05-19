import express from "express";
import {
  createCustomProvider,
  deleteCustomProvider,
  getCustomProvider,
  getCustomProviders,
  updateCustomProvider,
} from "../services/customProviderStore.js";
import { deleteProjectKey, setProjectKey } from "../services/keyStore.js";
import { CustomHTTPModel, CustomOpenAICompatModel } from "../services/llmProviders/customModel.js";
import { loadOwnedProject } from "./routeContext.js";

const router = express.Router();

function rejectNullProject(req, res) {
  if (!req.params.projectId || req.params.projectId === "null" || req.params.projectId === "undefined") {
    res.status(400).json({ error: "projectId is required and must be a valid project ID" });
    return true;
  }
  return false;
}

router.get("/:projectId/custom-providers", async (req, res) => {
  if (rejectNullProject(req, res)) return;
  try {
    const project = await loadOwnedProject(req, res);
    if (!project) return;

    const providers = await getCustomProviders(project.id);
    res.json({ providers });
  } catch (err) {
    console.error("[customProviders] DB error:", err.message);
    res.json({ providers: [], dbError: true });
  }
});

router.post("/:projectId/custom-providers", async (req, res) => {
  if (rejectNullProject(req, res)) return;
  const { name, type, baseUrl, authHeaderName, models, requestTemplate, responsePath, apiKey } = req.body;

  if (!name?.trim()) return res.status(400).json({ error: "name is required" });
  if (!type) return res.status(400).json({ error: "type is required" });
  if (!baseUrl?.trim()) return res.status(400).json({ error: "baseUrl is required" });

  const validTypes = ["openai-compat", "local", "custom-http"];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: `type must be one of: ${validTypes.join(", ")}` });
  }

  try {
    const project = await loadOwnedProject(req, res);
    if (!project) return;

    const provider = await createCustomProvider(project.id, {
      name: name.trim(),
      type,
      baseUrl: baseUrl.trim(),
      authHeaderName,
      models,
      requestTemplate,
      responsePath,
    });

    if (apiKey?.trim()) {
      await setProjectKey(project.id, provider.id, apiKey.trim());
    }

    res.status(201).json({ provider });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:projectId/custom-providers/:customId", async (req, res) => {
  if (rejectNullProject(req, res)) return;
  const { customId } = req.params;
  const { name, type, baseUrl, authHeaderName, models, requestTemplate, responsePath, apiKey } = req.body;

  if (!name?.trim()) return res.status(400).json({ error: "name is required" });
  if (!type) return res.status(400).json({ error: "type is required" });
  if (!baseUrl?.trim()) return res.status(400).json({ error: "baseUrl is required" });

  try {
    const project = await loadOwnedProject(req, res);
    if (!project) return;

    const provider = await updateCustomProvider(project.id, customId, {
      name: name.trim(),
      type,
      baseUrl: baseUrl.trim(),
      authHeaderName,
      models,
      requestTemplate,
      responsePath,
    });
    if (!provider) return res.status(404).json({ error: "Custom provider not found" });

    if (apiKey?.trim()) {
      await setProjectKey(project.id, provider.id, apiKey.trim());
    }

    res.json({ provider });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:projectId/custom-providers/:customId", async (req, res) => {
  if (rejectNullProject(req, res)) return;
  const { customId } = req.params;

  try {
    const project = await loadOwnedProject(req, res);
    if (!project) return;

    await deleteProjectKey(project.id, customId).catch(() => {});
    await deleteCustomProvider(project.id, customId);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:projectId/custom-providers/:customId/test", async (req, res) => {
  if (rejectNullProject(req, res)) return;
  const { customId } = req.params;
  const { apiKey } = req.body;

  try {
    const project = await loadOwnedProject(req, res);
    if (!project) return;

    const provider = await getCustomProvider(project.id, customId);
    if (!provider) return res.status(404).json({ error: "Custom provider not found" });

    const model = buildModel(provider, apiKey?.trim() || "");
    await model.invoke([{ role: "user", content: "Hi" }]);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.post("/:projectId/custom-providers/test-config", async (req, res) => {
  if (rejectNullProject(req, res)) return;
  const { type, baseUrl, authHeaderName, requestTemplate, responsePath, apiKey } = req.body;
  if (!baseUrl?.trim()) return res.status(400).json({ error: "baseUrl is required" });

  try {
    const project = await loadOwnedProject(req, res);
    if (!project) return;

    const provider = { type, baseUrl: baseUrl.trim(), authHeaderName, requestTemplate, responsePath };
    const model = buildModel(provider, apiKey?.trim() || "");
    await model.invoke([{ role: "user", content: "Hi" }]);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.get("/:projectId/custom-providers/discover-models", async (req, res) => {
  if (rejectNullProject(req, res)) return;
  const { baseUrl, apiKey } = req.query;
  if (!baseUrl) return res.status(400).json({ error: "baseUrl is required" });

  try {
    const project = await loadOwnedProject(req, res);
    if (!project) return;

    const url = String(baseUrl).replace(/\/+$/, "") + "/v1/models";
    const headers = {};
    if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

    const response = await fetch(url, { headers });
    if (!response.ok) {
      const text = await response.text().catch(() => response.statusText);
      return res.status(400).json({ ok: false, error: `${response.status}: ${text}` });
    }

    const json = await response.json();
    const models = (json.data || json.models || []).map((model) => ({
      id: model.id || model.name || String(model),
      name: model.name || model.id || String(model),
    }));

    res.json({ ok: true, models });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

function buildModel(provider, apiKey) {
  if (provider.type === "custom-http") {
    return new CustomHTTPModel({
      apiKey,
      model: provider.models?.[0]?.id || "test",
      temperature: 0,
      maxTokens: 8,
      baseURL: provider.baseUrl,
      authHeaderName: provider.authHeaderName,
      requestTemplate: provider.requestTemplate,
      responsePath: provider.responsePath,
    });
  }

  return new CustomOpenAICompatModel({
    apiKey,
    model: provider.models?.[0]?.id || "test",
    temperature: 0,
    maxTokens: 8,
    baseURL: provider.baseUrl,
  });
}

export default router;
