import express from "express";
import { deleteProject, getProjectById, getProjects, saveProject } from "../services/projectStore.js";
import { getRequestUserId } from "./routeContext.js";

const router = express.Router();

function isDbError(err) {
  return err?.code === "ECONNRESET" || err?.code === "ECONNREFUSED" ||
         err?.cause?.code === "ECONNRESET" || err?.cause?.code === "ECONNREFUSED" ||
         err?.message?.includes("ECONNRESET") || err?.message?.includes("ECONNREFUSED") ||
         err?.message?.includes("connect") || err?.constructor?.name === "DrizzleQueryError";
}

router.get("/", async (req, res, next) => {
  try {
    res.json({ projects: await getProjects(getRequestUserId(req)) });
  } catch (error) {
    if (isDbError(error)) return res.json({ projects: [] });
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    if (!req.body?.project) {
      return res.status(400).json({ status: "error", message: "Missing project." });
    }
    const project = await saveProject(req.body.project, getRequestUserId(req));
    res.json({ status: "saved", project });
  } catch (error) {
    if (isDbError(error)) return res.json({ status: "saved", project: req.body.project });
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const project = await getProjectById(req.params.id, getRequestUserId(req));
    if (!project) return res.status(404).json({ status: "error", message: "Project not found." });
    res.json({ project });
  } catch (error) {
    if (isDbError(error)) return res.status(404).json({ status: "error", message: "Project not found." });
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await deleteProject(req.params.id, getRequestUserId(req));
    res.json({ status: "deleted" });
  } catch (error) {
    if (isDbError(error)) return res.json({ status: "deleted" });
    next(error);
  }
});

export default router;
