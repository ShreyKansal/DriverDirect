import express from "express";
import { getProvider } from "../config/providers.js";
import { createChatModel } from "../services/llmClient.js";
import {
  deleteGlobalKey,
  getGlobalKey,
  getGlobalKeyStatus,
  setGlobalKey,
} from "../services/keyStore.js";
import { getRequestUserId } from "./routeContext.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const configured = await getGlobalKeyStatus(getRequestUserId(req));
    res.json({ configured });
  } catch (err) {
    console.error("[globalKeys] DB error:", err.message);
    res.json({ configured: [], dbError: true });
  }
});

router.get("/:providerId", async (req, res) => {
  try {
    const entry = await getGlobalKey(getRequestUserId(req), req.params.providerId);
    if (!entry) {
      return res.status(404).json({ error: "Key not found." });
    }
    res.json({ apiKey: entry.apiKey, updatedAt: entry.updatedAt });
  } catch (err) {
    console.error("[globalKeys] DB error on load:", err.message);
    res.status(503).json({ error: "Database unavailable." });
  }
});

router.put("/:providerId", async (req, res) => {
  const { providerId } = req.params;
  const { apiKey } = req.body;

  if (!apiKey || typeof apiKey !== "string" || !apiKey.trim()) {
    return res.status(400).json({ error: "apiKey is required" });
  }
  if (!getProvider(providerId)) {
    return res.status(400).json({ error: `Unknown provider: ${providerId}` });
  }

  try {
    await setGlobalKey(getRequestUserId(req), providerId, apiKey.trim());
    res.json({ ok: true });
  } catch (err) {
    console.error("[globalKeys] DB error on save:", err.message);
    res.status(503).json({ error: "Database unavailable." });
  }
});

router.delete("/:providerId", async (req, res) => {
  try {
    await deleteGlobalKey(getRequestUserId(req), req.params.providerId);
    res.json({ ok: true });
  } catch (err) {
    console.error("[globalKeys] DB error on delete:", err.message);
    res.json({ ok: true });
  }
});

router.post("/:providerId/test", async (req, res) => {
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
