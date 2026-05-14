import express from "express";
import { getProvider }      from "../config/providers.js";
import { createChatModel }  from "../services/llmClient.js";
import {
  setProjectKey,
  deleteProjectKey,
  getProjectKeyStatus
} from "../services/keyStore.js";

const router = express.Router();

// GET /api/projects/:projectId/keys
// Returns configured providers for this project (masked key previews, no raw keys)
router.get("/:projectId/keys", async (req, res) => {
  try {
    const configured = await getProjectKeyStatus(req.params.projectId);
    res.json({ configured });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/projects/:projectId/keys/:providerId
// Save or update an API key for a provider
router.put("/:projectId/keys/:providerId", async (req, res) => {
  const { projectId, providerId } = req.params;
  const { apiKey } = req.body;

  if (!apiKey || typeof apiKey !== "string" || !apiKey.trim()) {
    return res.status(400).json({ error: "apiKey is required" });
  }
  if (!getProvider(providerId)) {
    return res.status(400).json({ error: `Unknown provider: ${providerId}` });
  }

  try {
    await setProjectKey(projectId, providerId, apiKey.trim());
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/projects/:projectId/keys/:providerId
// Remove a provider's API key from this project
router.delete("/:projectId/keys/:providerId", async (req, res) => {
  try {
    await deleteProjectKey(req.params.projectId, req.params.providerId);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/projects/:projectId/keys/:providerId/test
// Validate the key by making a minimal API call
router.post("/:projectId/keys/:providerId/test", async (req, res) => {
  const { providerId } = req.params;
  const { apiKey } = req.body;

  if (!apiKey || typeof apiKey !== "string") {
    return res.status(400).json({ error: "apiKey is required" });
  }

  const provider = getProvider(providerId);
  if (!provider) return res.status(400).json({ error: `Unknown provider: ${providerId}` });

  try {
    const model = createChatModel(
      { provider: providerId, model: provider.models[0]?.id, temperature: 0, maxTokens: 8 },
      { [providerId]: apiKey.trim() }
    );
    await model.invoke([{ role: "user", content: "Hi" }]);
    res.json({ ok: true });
  } catch (err) {
    let message = err.message || "Request failed";
    // Anthropic/OpenAI return structured error messages — extract them
    try {
      const parsed = JSON.parse(message.replace(/^\d+\s+/, ""));
      message = parsed?.error?.message || message;
    } catch { /* not JSON */ }
    res.status(400).json({ ok: false, error: message });
  }
});

export default router;
