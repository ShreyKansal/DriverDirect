import express from "express";
import { getProvider } from "../config/providers.js";
import { createChatModel } from "../services/llmClient.js";
import {
  deleteProjectKey,
  getProjectKey,
  getProjectKeyStatus,
  setProjectKey,
} from "../services/keyStore.js";
import { loadOwnedProject } from "./routeContext.js";

const router = express.Router();

router.get("/:projectId/keys", async (req, res) => {
  try {
    const project = await loadOwnedProject(req, res);
    if (!project) return;

    const configured = await getProjectKeyStatus(project.id);
    res.json({ configured });
  } catch (err) {
    console.error("[keys] DB error:", err.message);
    res.json({ configured: [], dbError: true });
  }
});

router.get("/:projectId/keys/:providerId", async (req, res) => {
  try {
    const project = await loadOwnedProject(req, res);
    if (!project) return;

    const entry = await getProjectKey(project.id, req.params.providerId);
    if (!entry) {
      return res.status(404).json({ error: "Key not found." });
    }
    res.json({ apiKey: entry.apiKey, updatedAt: entry.updatedAt });
  } catch (err) {
    console.error("[keys] DB error on load:", err.message);
    res.status(503).json({ error: "Database unavailable." });
  }
});

router.put("/:projectId/keys/:providerId", async (req, res) => {
  const { providerId } = req.params;
  const { apiKey } = req.body;

  if (!apiKey || typeof apiKey !== "string" || !apiKey.trim()) {
    return res.status(400).json({ error: "apiKey is required" });
  }
  if (!getProvider(providerId)) {
    return res.status(400).json({ error: `Unknown provider: ${providerId}` });
  }

  try {
    const project = await loadOwnedProject(req, res);
    if (!project) return;

    await setProjectKey(project.id, providerId, apiKey.trim());
    res.json({ ok: true });
  } catch (err) {
    console.error("[keys] DB error on save:", err.message);
    res.status(503).json({ error: "Database unavailable." });
  }
});

router.delete("/:projectId/keys/:providerId", async (req, res) => {
  try {
    const project = await loadOwnedProject(req, res);
    if (!project) return;

    await deleteProjectKey(project.id, req.params.providerId);
    res.json({ ok: true });
  } catch (err) {
    console.error("[keys] DB error on delete:", err.message);
    res.json({ ok: true });
  }
});

router.post("/:projectId/keys/:providerId/test", async (req, res) => {
  const { providerId } = req.params;
  const { apiKey } = req.body;

  if (!apiKey || typeof apiKey !== "string") {
    return res.status(400).json({ error: "apiKey is required" });
  }

  const provider = getProvider(providerId);
  if (!provider) return res.status(400).json({ error: `Unknown provider: ${providerId}` });

  try {
    const project = await loadOwnedProject(req, res);
    if (!project) return;

    const model = createChatModel(
      { provider: providerId, model: provider.models[0]?.id, temperature: 0, maxTokens: 8 },
      { [providerId]: apiKey.trim() },
    );
    await model.invoke([{ role: "user", content: "Hi" }]);
    res.json({ ok: true });
  } catch (err) {
    let message = err.message || "Request failed";
    try {
      const parsed = JSON.parse(message.replace(/^\d+\s+/, ""));
      message = parsed?.error?.message || message;
    } catch {
      // Not JSON.
    }
    res.status(400).json({ ok: false, error: message });
  }
});

export default router;
