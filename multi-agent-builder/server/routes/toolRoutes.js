import { Router } from "express";
import { BUILTIN_TOOLS } from "../tools/builtinRegistry.js";

const router = Router();

router.get("/builtin", (req, res) => {
  res.json({ tools: BUILTIN_TOOLS });
});

export default router;
