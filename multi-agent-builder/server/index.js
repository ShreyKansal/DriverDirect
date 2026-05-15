import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import flowRoutes from "./routes/flowRoutes.js";
import runRoutes from "./routes/runRoutes.js";
import agentRoutes from "./routes/agentRoutes.js";
import toolRoutes from "./routes/toolRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import customProviderRoutes from "./routes/customProviderRoutes.js";
import { cleanupOrphans } from "./services/sandboxManager.js";
import { migrate } from "./db/migrate.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/agents", agentRoutes);
app.use("/api/flows", flowRoutes);
app.use("/api/run", runRoutes);
app.use("/api/tools", toolRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/projects", settingsRoutes);
app.use("/api/projects", customProviderRoutes);
app.use("/api/users", userRoutes);

// Kill any sandbox containers left over from a previous crashed session
cleanupOrphans().catch(() => {});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({
    status: "error",
    message: err.message || "Unexpected server error"
  });
});

migrate()
  .then(() => {
    app.listen(env.port, () => {
      console.log(`Multi-Agent Builder API running on http://localhost:${env.port}`);
    });
  })
  .catch((err) => {
    console.error("DB migration failed:", err.message);
    process.exit(1);
  });
